import 'package:drift/drift.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/constants/enums.dart' as enums;
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:logging/logging.dart';

/// ImmichPlus: one-way sync from the iOS Photos "Hidden" smart album into the
/// Immich "Locked Folder" visibility.
///
/// Flow (every sync cycle):
///   1. Ask the native side for the `localIdentifier` of every hidden asset
///      via the `app.immichplus/hidden_album` MethodChannel.
///   2. Join those ids against `local_asset_entity` → `remote_asset_entity`
///      (by `checksum`) to find which hidden assets are already on the server
///      but not yet flagged `locked`.
///   3. Bulk-update their visibility to `AssetVisibility.locked` so they
///      disappear from the main gallery, map and search on every client.
///
/// Native side: [mobile/ios/Runner/Sync/HiddenAlbumPlugin.swift]. Requires
/// `NSPhotoLibraryIncludeHiddenUsageDescription` in Info.plist (present).
///
/// Android: no-op — Android has no OS-level hidden album concept.
class IosHiddenSyncService {
  static const _channel = MethodChannel('app.immichplus/hidden_album');
  final Drift _db;
  final AssetApiRepository _assetApi;
  final Logger _log = Logger('IosHiddenSyncService');

  IosHiddenSyncService({required Drift db, required AssetApiRepository assetApi})
    : _db = db,
      _assetApi = assetApi;

  Future<void> syncHiddenToLockedFolder() async {
    if (!CurrentPlatform.isIOS) return;
    if (!Store.get(StoreKey.syncIosHiddenToLockedFolder, true)) return;

    try {
      final hiddenLocalIds = await _fetchHiddenLocalIds();
      if (hiddenLocalIds.isEmpty) {
        _log.fine('No hidden iOS assets to sync');
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
      _log.warning('iOS Hidden → LockedFolder sync failed', e, s);
    }
  }

  Future<List<String>> _fetchHiddenLocalIds() async {
    final raw = await _channel.invokeMethod<List<Object?>>('getHiddenAssetIds');
    if (raw == null) return const [];
    return raw.whereType<String>().toList(growable: false);
  }

  /// Returns the remote-asset IDs whose checksum matches any of [hiddenLocalIds]
  /// and whose current visibility is not yet `locked`. Batched in chunks of
  /// 500 to stay well under SQLite's default variable limit (999).
  Future<List<String>> _resolveRemoteIdsForHidden(List<String> hiddenLocalIds) async {
    if (hiddenLocalIds.isEmpty) return const [];
    const batchSize = 500;
    final result = <String>[];
    for (var i = 0; i < hiddenLocalIds.length; i += batchSize) {
      final end = (i + batchSize < hiddenLocalIds.length) ? i + batchSize : hiddenLocalIds.length;
      final batch = hiddenLocalIds.sublist(i, end);
      final placeholders = List.filled(batch.length, '?').join(',');
      final rows = await _db
          .customSelect(
            '''
            SELECT DISTINCT rae.id AS asset_id
            FROM local_asset_entity lae
            INNER JOIN remote_asset_entity rae
              ON rae.checksum = lae.checksum AND rae.deleted_at IS NULL
            WHERE lae.id IN ($placeholders)
              AND rae.visibility != ${enums.AssetVisibilityEnum.locked.index}
            ''',
            variables: batch.map(Variable<String>.new).toList(),
          )
          .get();
      result.addAll(rows.map((row) => row.read<String>('asset_id')));
    }
    return result;
  }
}
