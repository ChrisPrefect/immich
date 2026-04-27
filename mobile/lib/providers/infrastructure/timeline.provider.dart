import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/config/filter_albums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/filter/filter_types.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/filter.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/timeline/photos_filter.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final timelineRepositoryProvider = Provider<DriftTimelineRepository>(
  (ref) => DriftTimelineRepository(ref.watch(driftProvider)),
);

final timelineArgsProvider = Provider.autoDispose<TimelineArgs>(
  (ref) => throw UnimplementedError('Will be overridden through a ProviderScope.'),
);

final _mainTimelineServiceProvider = Provider<TimelineService>((ref) {
  final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
  final timelineService = ref.watch(timelineFactoryProvider).main(timelineUsers);
  ref.onDispose(timelineService.dispose);
  return timelineService;
});

final timelineServiceProvider = Provider<TimelineService>(
  (ref) {
    final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
    final filter = ref.watch(photosFilterProvider);
    final user = ref.watch(currentUserProvider);
    final factory = ref.watch(timelineFactoryProvider);
    final showOnlyPhotos = ref.watch(showOnlyPhotosProvider);
    final personFilter = ref.watch(personFilterProvider);
    final mediaTypeFilter = ref.watch(mediaTypeFilterProvider);
    final query = switch (filter.mode) {
      PhotosFilterMode.all => factory.mainQuery(
        timelineUsers,
        assetType: switch (mediaTypeFilter) {
          MediaTypeFilterType.all => null,
          MediaTypeFilterType.images => AssetType.image,
          MediaTypeFilterType.videos => AssetType.video,
        },
        rachelAlbumId: FilterAlbums.rachel,
        showRachel: switch (personFilter) {
          PersonFilterType.all => null,
          PersonFilterType.chris => false,
          PersonFilterType.rachel => true,
        },
        excludeAutoTagged: showOnlyPhotos,
        documentsAlbumId: showOnlyPhotos ? FilterAlbums.documents : '',
        screenshotsAlbumId: showOnlyPhotos ? FilterAlbums.screenshots : '',
        documentationAlbumId: showOnlyPhotos ? FilterAlbums.documentation : '',
      ),
      PhotosFilterMode.favorites => user != null ? factory.favoriteQuery(user.id) : factory.mainQuery(timelineUsers),
      PhotosFilterMode.videos => user != null ? factory.videoQuery(user.id) : factory.mainQuery(timelineUsers),
      PhotosFilterMode.images => user != null ? factory.imageQuery(user.id) : factory.mainQuery(timelineUsers),
      PhotosFilterMode.album =>
        filter.albumId != null ? factory.remoteAlbumQuery(albumId: filter.albumId!) : factory.mainQuery(timelineUsers),
    };
    final queryKey = (
      timelineUsers: timelineUsers.join('\u001f'),
      filterMode: filter.mode,
      albumId: filter.albumId,
      userId: user?.id,
      personFilter: personFilter,
      mediaTypeFilter: mediaTypeFilter,
      showOnlyPhotos: showOnlyPhotos,
      factory: factory,
    );
    final timelineService = ref.watch(_mainTimelineServiceProvider);
    timelineService.replaceQuery(query, queryKey);
    return timelineService;
  },
  // Empty dependencies to inform the framework that this provider
  // might be used in a ProviderScope
  dependencies: [],
);

final timelineFactoryProvider = Provider<TimelineFactory>(
  (ref) => TimelineFactory(
    timelineRepository: ref.watch(timelineRepositoryProvider),
    settingsService: ref.watch(settingsProvider),
  ),
);

final timelineUsersProvider = StreamProvider<List<String>>((ref) {
  final currentUserId = ref.watch(currentUserProvider.select((u) => u?.id));
  if (currentUserId == null) {
    return Stream.value([]);
  }

  return ref.watch(timelineRepositoryProvider).watchTimelineUserIds(currentUserId);
});
