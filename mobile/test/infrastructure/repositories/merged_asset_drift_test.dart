import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
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

  test('mergedBucket falls back to createdAt when localDateTime is null', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await db
        .into(db.userEntity)
        .insert(UserEntityCompanion.insert(id: userId, email: 'user-1@test.dev', name: 'User 1'));

    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: 'asset-1',
            name: 'asset-1.jpg',
            type: AssetType.image,
            checksum: 'checksum-1',
            ownerId: userId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            localDateTime: const Value(null),
          ),
        );

    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId], hiddenAlbumId: '')
        .get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
    expect(buckets.single.bucketDate, isNotEmpty);
  });

  test('mergedAsset excludes local assets from the iOS Hidden album', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await _insertLocalAlbum('camera', BackupSelection.selected);
    await _insertLocalAlbum('hidden', BackupSelection.selected);
    await _insertLocalAsset('visible-asset', 'visible-checksum', createdAt);
    await _insertLocalAsset('hidden-asset', 'hidden-checksum', createdAt);
    await _insertLocalAlbumAsset('camera', 'visible-asset');
    await _insertLocalAlbumAsset('camera', 'hidden-asset');
    await _insertLocalAlbumAsset('hidden', 'hidden-asset');

    final unprotectedAssets = await db.mergedAssetDrift
        .mergedAsset(userIds: [userId], hiddenAlbumId: 'hidden', limit: (_) => Limit(10, 0))
        .get();
    final unfilteredAssets = await db.mergedAssetDrift
        .mergedAsset(userIds: [userId], hiddenAlbumId: '', limit: (_) => Limit(10, 0))
        .get();

    expect(unprotectedAssets.map((asset) => asset.localId), ['visible-asset']);
    expect(unfilteredAssets.map((asset) => asset.localId), containsAll(['visible-asset', 'hidden-asset']));
  });

  test('mergedBucket excludes local assets from the iOS Hidden album', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await _insertLocalAlbum('camera', BackupSelection.selected);
    await _insertLocalAlbum('hidden', BackupSelection.selected);
    await _insertLocalAsset('visible-asset', 'visible-checksum', createdAt);
    await _insertLocalAsset('hidden-asset', 'hidden-checksum', createdAt);
    await _insertLocalAlbumAsset('camera', 'visible-asset');
    await _insertLocalAlbumAsset('camera', 'hidden-asset');
    await _insertLocalAlbumAsset('hidden', 'hidden-asset');

    final buckets = await db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId], hiddenAlbumId: 'hidden')
        .get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
  });

  Future<void> _insertLocalAlbum(String id, BackupSelection backupSelection) {
    return db
        .into(db.localAlbumEntity)
        .insert(LocalAlbumEntityCompanion.insert(id: id, name: id, backupSelection: backupSelection));
  }

  Future<void> _insertLocalAsset(String id, String checksum, DateTime createdAt) {
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

  Future<void> _insertLocalAlbumAsset(String albumId, String assetId) {
    return db
        .into(db.localAlbumAssetEntity)
        .insert(LocalAlbumAssetEntityCompanion.insert(albumId: albumId, assetId: assetId));
  }
}
