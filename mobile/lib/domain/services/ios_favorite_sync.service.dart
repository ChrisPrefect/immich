import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:logging/logging.dart';

/// One-way sync: copies the `isFavorite` flag from the iOS Photos library
/// (stored in `local_asset_entity.is_favorite` by [LocalSyncService]) to the
/// matching Immich server asset whenever the two disagree. Controlled by
/// [StoreKey.syncIosFavorites] (Immich+ feature, default on).
class IosFavoriteSyncService {
  final Drift _db;
  final AssetApiRepository _assetApi;
  final Logger _log = Logger('IosFavoriteSyncService');

  IosFavoriteSyncService({required Drift db, required AssetApiRepository assetApi})
    : _db = db,
      _assetApi = assetApi;

  /// Scans for local/remote checksum matches where `is_favorite` differs and
  /// pushes the local state (which reflects iOS) to the server.
  Future<void> syncFavoritesToServer() async {
    if (!CurrentPlatform.isIOS) return;
    if (!Store.get(StoreKey.syncIosFavorites, true)) return;

    try {
      final rows = await _db
          .customSelect(
            '''
            SELECT rae.id AS asset_id, lae.is_favorite AS local_fav
            FROM local_asset_entity lae
            INNER JOIN remote_asset_entity rae
              ON rae.checksum = lae.checksum AND rae.deleted_at IS NULL
            WHERE lae.is_favorite != rae.is_favorite
            ''',
          )
          .get();

      if (rows.isEmpty) return;

      final toFavorite = <String>[];
      final toUnfavorite = <String>[];
      for (final row in rows) {
        final id = row.read<String>('asset_id');
        final isFav = row.read<bool>('local_fav');
        (isFav ? toFavorite : toUnfavorite).add(id);
      }

      _log.info('Syncing iOS favorites → server: +${toFavorite.length} / -${toUnfavorite.length}');

      await _bulkUpdate(toFavorite, true);
      await _bulkUpdate(toUnfavorite, false);
    } catch (e, s) {
      _log.warning('iOS favorite sync failed', e, s);
    }
  }

  /// Batch bulk-update server favorite flag in chunks — Immich's bulk endpoint
  /// can theoretically accept thousands of ids, but network payload and server
  /// ergonomics favor smaller requests.
  Future<void> _bulkUpdate(List<String> ids, bool isFavorite) async {
    if (ids.isEmpty) return;
    const batchSize = 500;
    for (var i = 0; i < ids.length; i += batchSize) {
      final end = (i + batchSize < ids.length) ? i + batchSize : ids.length;
      await _assetApi.updateFavorite(ids.sublist(i, end), isFavorite);
    }
  }
}
