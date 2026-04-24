import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/photos_filter.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/photos_filter_title.dart';

@RoutePage()
class MainTimelinePage extends ConsumerWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hideMemoriesLane = ref.watch(settingsProvider.select((s) => s.get(Setting.hideMemoriesLane)));
    final hasMemories = ref.watch(driftMemoryFutureProvider.select((state) => state.value?.isNotEmpty ?? false));
    final filter = ref.watch(photosFilterProvider);

    // ImmichPlus: every filter switch re-opens the view, so when reverse-order
    // is on, jump back down to the newest asset (like iOS Photos). The
    // Timeline widget may stay mounted across filter changes (the
    // `ProviderScope` override only replaces the inner service), so we
    // explicitly poke it via an event instead of relying on initState.
    ref.listen(photosFilterProvider, (prev, next) {
      if (prev == next) return;
      if (!ref.read(settingsProvider).get(Setting.reverseTimeline)) return;
      EventStream.shared.emit(const ScrollToBottomEvent());
    });

    final appBar = const ImmichSliverAppBar(
      floating: true,
      pinned: false,
      snap: false,
      title: PhotosFilterTitle(),
    );
    final showMemoryLane = !hideMemoriesLane && filter.mode == PhotosFilterMode.all;

    final timeline = Timeline(
      topSliverWidget: showMemoryLane ? const SliverToBoxAdapter(child: DriftMemoryLane()) : null,
      topSliverWidgetHeight: showMemoryLane && hasMemories ? 200 : 0,
      showStorageIndicator: true,
      appBar: appBar,
    );

    if (filter.mode == PhotosFilterMode.all) {
      // Default main timeline — use the shared [timelineServiceProvider].
      return timeline;
    }

    // Non-default filter: override the scoped timeline service with the
    // filtered query. Each filter change rebuilds a fresh service.
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          final users = ref.watch(timelineUsersProvider).valueOrNull ?? [];
          if (user == null) {
            throw Exception('User must be logged in to access the timeline');
          }
          final factory = ref.watch(timelineFactoryProvider);
          final service = switch (filter.mode) {
            PhotosFilterMode.all => factory.main(users),
            PhotosFilterMode.favorites => factory.favorite(user.id),
            PhotosFilterMode.videos => factory.video(user.id),
            PhotosFilterMode.images => factory.image(user.id),
            PhotosFilterMode.album => filter.albumId != null
                ? factory.remoteAlbum(albumId: filter.albumId!)
                : factory.main(users),
          };
          ref.onDispose(service.dispose);
          return service;
        }),
      ],
      child: timeline,
    );
  }
}
