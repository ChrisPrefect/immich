import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';

import '../../medium/repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late DriftTimelineRepository sut;

  setUp(() {
    ctx = MediumRepositoryContext();
    sut = DriftTimelineRepository(ctx.db);
  });

  tearDown(() async {
    await ctx.dispose();
  });

  test('locked folder excludes linked live photo motion assets', () async {
    final user = await ctx.newUser();
    final motion = await ctx.newRemoteAsset(
      ownerId: user.id,
      type: AssetType.video,
      visibility: AssetVisibility.locked,
      createdAt: DateTime(2024, 1, 1),
    );
    final still = await ctx.newRemoteAsset(
      ownerId: user.id,
      type: AssetType.image,
      visibility: AssetVisibility.locked,
      livePhotoVideoId: motion.id,
      createdAt: DateTime(2024, 1, 2),
    );

    final timeline = sut.locked(user.id, GroupAssetsBy.day);
    final assets = await timeline.assetSource(0, 10);

    expect(assets.map((asset) => asset.remoteId), [still.id]);
  });
}
