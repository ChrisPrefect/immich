import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/constants/enums.dart' as enums;
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:logging/logging.dart';

/// One-way sync from iOS Photos' Hidden album into Immich's Locked Folder.
///
/// When enabled, the regular iOS backup pipeline is allowed to see Hidden
/// assets, the actual Hidden smart album is forced into backup selection, and
/// already-uploaded checksum matches are moved to the server-side locked
/// folder.
class IosHiddenSyncService {
  static const _channel = MethodChannel('app.immichplus/hidden_album');
  final Drift _db;
  final AssetApiRepository _assetApi;
  final LocalAlbumService _localAlbumService;
  final Logger _log = Logger('IosHiddenSyncService');

  IosHiddenSyncService({
    required Drift db,
    required AssetApiRepository assetApi,
    required LocalAlbumService localAlbumService,
  }) : _db = db,
       _assetApi = assetApi,
       _localAlbumService = localAlbumService;

  Future<void> syncHiddenToLockedFolder() async {
    if (!CurrentPlatform.isIOS) return;
    if (!Store.get(StoreKey.syncIosHiddenToLockedFolder, true)) return;

    try {
      final hiddenAlbumId = await getHiddenAlbumId();
      if (hiddenAlbumId != null) {
        await Store.put(StoreKey.iosHiddenAlbumId, hiddenAlbumId);
        await _ensureHiddenAlbumSelected(hiddenAlbumId);
      }

      final hiddenLocalIds = await getHiddenLocalIds();
      if (hiddenLocalIds.isEmpty) {
        _log.fine('No readable iOS Hidden assets right now');
        return;
      }

      final remoteIds = await _resolveRemoteIdsForHidden(hiddenLocalIds);
      if (remoteIds.isEmpty) {
        _log.fine('${hiddenLocalIds.length} hidden iOS assets have no matching remote yet');
        return;
      }

      _log.info('Moving ${remoteIds.length} hidden assets to Immich locked folder');
      await _assetApi.updateVisibility(remoteIds, enums.AssetVisibilityEnum.locked);
    } catch (e, s) {
      _log.warning('iOS Hidden → Locked Folder sync failed', e, s);
    }
  }

  Future<String?> getHiddenAlbumId() async {
    final id = await _channel.invokeMethod<String>('getHiddenAlbumId');
    if (id == null || id.isEmpty) {
      return null;
    }
    return id;
  }

  Future<List<String>> getHiddenLocalIds() async {
    final raw = await _channel.invokeMethod<List<Object?>>('getHiddenAssetIds');
    if (raw == null) return const [];
    return raw.whereType<String>().toList(growable: false);
  }

  Future<void> _ensureHiddenAlbumSelected(String hiddenAlbumId) async {
    final album = (await _localAlbumService.getAll()).firstWhereOrNull((album) => album.id == hiddenAlbumId);
    if (album == null || album.backupSelection == BackupSelection.selected) {
      return;
    }

    await _localAlbumService.update(album.copyWith(backupSelection: BackupSelection.selected));
    _log.info('Enabled backup for iOS Hidden album');
  }

  /// Returns the remote-asset IDs whose checksum matches any of [hiddenLocalIds]
  /// and whose current visibility is not yet `locked`.
  Future<List<String>> _resolveRemoteIdsForHidden(List<String> hiddenLocalIds) async {
    if (hiddenLocalIds.isEmpty) return const [];
    const batchSize = 500;
    final result = <String>[];
    for (var i = 0; i < hiddenLocalIds.length; i += batchSize) {
      final end = (i + batchSize < hiddenLocalIds.length) ? i + batchSize : hiddenLocalIds.length;
      final batch = hiddenLocalIds.sublist(i, end);
      final placeholders = List.filled(batch.length, '?').join(',');
      final rows = await _db.customSelect('''
            SELECT DISTINCT rae.id AS asset_id
            FROM local_asset_entity lae
            INNER JOIN remote_asset_entity rae
              ON rae.checksum = lae.checksum AND rae.deleted_at IS NULL
            WHERE lae.id IN ($placeholders)
              AND rae.visibility != ${enums.AssetVisibilityEnum.locked.index}
            ''', variables: batch.map(Variable<String>.new).toList()).get();
      result.addAll(rows.map((row) => row.read<String>('asset_id')));
    }
    return result;
  }
}
