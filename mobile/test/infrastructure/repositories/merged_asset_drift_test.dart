import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

void main() {
  late Drift db;

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
  });

  tearDown(() async {
    await db.close();
  });

  Future<void> insertLocalAlbum(String id, BackupSelection backupSelection) {
    return db
        .into(db.localAlbumEntity)
        .insert(LocalAlbumEntityCompanion.insert(id: id, name: id, backupSelection: backupSelection));
  }

  Future<void> insertLocalAsset(String id, String checksum, DateTime createdAt) {
    return db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: id,
            name: '$id.jpg',
            type: AssetType.image,
            checksum: Value(checksum),
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
          ),
        );
  }

  Future<void> insertLocalAlbumAsset(String albumId, String assetId) {
    return db
        .into(db.localAlbumAssetEntity)
        .insert(LocalAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
  }

  Future<void> insertUser(String id) {
    return db.into(db.userEntity).insert(UserEntityCompanion.insert(id: id, email: '$id@test.dev', name: id));
  }

  Future<void> insertRemoteAlbum(String id, String ownerId, {String? name}) {
    final now = DateTime(2024, 1, 1);
    return db
        .into(db.remoteAlbumEntity)
        .insert(
          RemoteAlbumEntityCompanion.insert(
            id: id,
            name: name ?? id,
            ownerId: ownerId,
            createdAt: Value(now),
            updatedAt: Value(now),
            order: AlbumAssetOrder.desc,
          ),
        );
  }

  Future<void> insertRemoteAlbumAsset(String albumId, String assetId) {
    return db
        .into(db.remoteAlbumAssetEntity)
        .insert(RemoteAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
  }

  Future<void> insertRemoteAsset({
    required String id,
    required String ownerId,
    required String checksum,
    required DateTime createdAt,
  }) {
    return db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: id,
            name: '$id.jpg',
            type: AssetType.image,
            checksum: checksum,
            ownerId: ownerId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
          ),
        );
  }

  Future<List<dynamic>> mergedAssets(
    String userId, {
    bool filterByRachelAlbum = false,
    bool showRachel = false,
    bool excludeAutoTagged = false,
    String rachelAlbumId = 'rachel',
    String documentsAlbumId = 'documents',
    String screenshotsAlbumId = 'screenshots',
    String documentationAlbumId = 'documentation',
  }) {
    return db.mergedAssetDrift
        .mergedAsset(
          userIds: [userId],
          assetType: -1,
          favoriteOnly: false,
          filterByRachelAlbum: filterByRachelAlbum,
          showRachel: showRachel,
          excludeAutoTagged: excludeAutoTagged,
          rachelAlbumId: rachelAlbumId,
          documentsAlbumId: documentsAlbumId,
          screenshotsAlbumId: screenshotsAlbumId,
          documentationAlbumId: documentationAlbumId,
          hiddenAlbumId: '',
          limit: (_) => Limit(10, 0),
        )
        .get();
  }

  Future<List<String>> mergedRemoteIds(
    String userId, {
    bool filterByRachelAlbum = false,
    bool showRachel = false,
    bool excludeAutoTagged = false,
  }) async {
    final rows = await mergedAssets(
      userId,
      filterByRachelAlbum: filterByRachelAlbum,
      showRachel: showRachel,
      excludeAutoTagged: excludeAutoTagged,
    );

    return rows.map<String?>((row) => row.remoteId as String?).nonNulls.toList();
  }

  Future<List<dynamic>> mergedBuckets(
    String userId, {
    bool filterByRachelAlbum = false,
    bool showRachel = false,
    bool excludeAutoTagged = false,
    String hiddenAlbumId = '',
  }) {
    return db.mergedAssetDrift
        .mergedBucket(
          groupBy: GroupAssetsBy.day.index,
          userIds: [userId],
          assetType: -1,
          favoriteOnly: false,
          filterByRachelAlbum: filterByRachelAlbum,
          showRachel: showRachel,
          excludeAutoTagged: excludeAutoTagged,
          rachelAlbumId: 'rachel',
          documentsAlbumId: 'documents',
          screenshotsAlbumId: 'screenshots',
          documentationAlbumId: 'documentation',
          hiddenAlbumId: hiddenAlbumId,
        )
        .get();
  }

  test('mergedBucket falls back to createdAt when localDateTime is null', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertUser(userId);
    await insertRemoteAsset(id: 'asset-1', ownerId: userId, checksum: 'checksum-1', createdAt: createdAt);

    final buckets = await mergedBuckets(userId);

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
    expect(buckets.single.bucketDate, isNotEmpty);
  });

  test('mergedAsset filters Rachel and Chris by remote album membership', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertUser(userId);
    await insertRemoteAlbum('rachel', userId);
    await insertRemoteAsset(id: 'rachel-asset', ownerId: userId, checksum: 'checksum-rachel', createdAt: createdAt);
    await insertRemoteAsset(
      id: 'chris-asset',
      ownerId: userId,
      checksum: 'checksum-chris',
      createdAt: createdAt.subtract(const Duration(minutes: 1)),
    );
    await insertRemoteAlbumAsset('rachel', 'rachel-asset');

    expect(await mergedRemoteIds(userId, filterByRachelAlbum: true, showRachel: true), ['rachel-asset']);
    expect(await mergedRemoteIds(userId, filterByRachelAlbum: true, showRachel: false), ['chris-asset']);
  });

  test('mergedAsset hides local assets while person filter is active', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertUser(userId);
    await insertLocalAlbum('camera', BackupSelection.selected);
    await insertLocalAsset('local-asset', 'local-checksum', createdAt);
    await insertLocalAlbumAsset('camera', 'local-asset');

    final defaultRows = await mergedAssets(userId);
    final personRows = await mergedAssets(userId, filterByRachelAlbum: true, showRachel: false);

    expect(defaultRows.map((asset) => asset.localId), ['local-asset']);
    expect(personRows.map((asset) => asset.localId), isEmpty);
  });

  test('mergedAsset excludes documents, screenshots and documentation albums from default gallery', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertUser(userId);
    for (final albumId in ['documents', 'screenshots', 'documentation']) {
      await insertRemoteAlbum(albumId, userId);
    }
    await insertRemoteAsset(id: 'normal', ownerId: userId, checksum: 'checksum-normal', createdAt: createdAt);
    await insertRemoteAsset(
      id: 'screenshot',
      ownerId: userId,
      checksum: 'checksum-screenshot',
      createdAt: createdAt.subtract(const Duration(minutes: 1)),
    );
    await insertRemoteAsset(
      id: 'document',
      ownerId: userId,
      checksum: 'checksum-document',
      createdAt: createdAt.subtract(const Duration(minutes: 2)),
    );
    await insertRemoteAsset(
      id: 'documentation',
      ownerId: userId,
      checksum: 'checksum-documentation',
      createdAt: createdAt.subtract(const Duration(minutes: 3)),
    );
    await insertRemoteAlbumAsset('screenshots', 'screenshot');
    await insertRemoteAlbumAsset('documents', 'document');
    await insertRemoteAlbumAsset('documentation', 'documentation');

    expect(await mergedRemoteIds(userId, excludeAutoTagged: true), ['normal']);

    final buckets = await mergedBuckets(userId, excludeAutoTagged: true);
    expect(buckets.fold<int>(0, (sum, bucket) => sum + (bucket.assetCount as int)), 1);
  });

  test('mergedAsset excludes local assets from the iOS Hidden album', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertLocalAlbum('camera', BackupSelection.selected);
    await insertLocalAlbum('hidden', BackupSelection.selected);
    await insertLocalAsset('visible-asset', 'visible-checksum', createdAt);
    await insertLocalAsset('hidden-asset', 'hidden-checksum', createdAt);
    await insertLocalAlbumAsset('camera', 'visible-asset');
    await insertLocalAlbumAsset('camera', 'hidden-asset');
    await insertLocalAlbumAsset('hidden', 'hidden-asset');

    final unprotectedAssets = await db.mergedAssetDrift
        .mergedAsset(
          userIds: [userId],
          assetType: -1,
          favoriteOnly: false,
          filterByRachelAlbum: false,
          showRachel: false,
          excludeAutoTagged: false,
          rachelAlbumId: '',
          documentsAlbumId: '',
          screenshotsAlbumId: '',
          documentationAlbumId: '',
          hiddenAlbumId: 'hidden',
          limit: (_) => Limit(10, 0),
        )
        .get();
    final unfilteredAssets = await db.mergedAssetDrift
        .mergedAsset(
          userIds: [userId],
          assetType: -1,
          favoriteOnly: false,
          filterByRachelAlbum: false,
          showRachel: false,
          excludeAutoTagged: false,
          rachelAlbumId: '',
          documentsAlbumId: '',
          screenshotsAlbumId: '',
          documentationAlbumId: '',
          hiddenAlbumId: '',
          limit: (_) => Limit(10, 0),
        )
        .get();

    expect(unprotectedAssets.map((asset) => asset.localId), ['visible-asset']);
    expect(unfilteredAssets.map((asset) => asset.localId), containsAll(['visible-asset', 'hidden-asset']));
  });

  test('mergedBucket excludes local assets from the iOS Hidden album', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertLocalAlbum('camera', BackupSelection.selected);
    await insertLocalAlbum('hidden', BackupSelection.selected);
    await insertLocalAsset('visible-asset', 'visible-checksum', createdAt);
    await insertLocalAsset('hidden-asset', 'hidden-checksum', createdAt);
    await insertLocalAlbumAsset('camera', 'visible-asset');
    await insertLocalAlbumAsset('camera', 'hidden-asset');
    await insertLocalAlbumAsset('hidden', 'hidden-asset');

    final buckets = await mergedBuckets(userId, hiddenAlbumId: 'hidden');

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
  });
}
