import 'package:auto_route/auto_route.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/filter/filter_types.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/filter.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/timeline/photos_filter.provider.dart';
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
    final personFilter = ref.watch(personFilterProvider);
    final mediaTypeFilter = ref.watch(mediaTypeFilterProvider);

    // ImmichPlus: every filter switch re-opens the view, so when reverse-order
    // is on, jump back down to the newest asset (like iOS Photos). The
    // Timeline widget stays mounted across filter changes, so we explicitly
    // poke it via an event instead of relying on initState.
    void scrollToNewestWhenReversed() {
      if (!ref.read(settingsProvider).get(Setting.reverseTimeline)) return;
      EventStream.shared.emit(const ScrollToBottomEvent());
    }

    ref.listen(photosFilterProvider, (prev, next) {
      if (prev == next) return;
      scrollToNewestWhenReversed();
    });
    ref.listen(personFilterProvider, (prev, next) {
      if (prev == next) return;
      scrollToNewestWhenReversed();
    });
    ref.listen(mediaTypeFilterProvider, (prev, next) {
      if (prev == next) return;
      scrollToNewestWhenReversed();
    });
    ref.listen(showOnlyPhotosProvider, (prev, next) {
      if (prev == next) return;
      scrollToNewestWhenReversed();
    });

    final appBar = const ImmichSliverAppBar(floating: true, pinned: false, snap: false, title: PhotosFilterTitle());
    final showFilterControls = filter.mode == PhotosFilterMode.all;
    final showMemoryLane =
        showFilterControls &&
        !hideMemoriesLane &&
        personFilter == PersonFilterType.all &&
        mediaTypeFilter == MediaTypeFilterType.all;
    final topSliverHeight = (showFilterControls ? 52.0 : 0.0) + (showMemoryLane && hasMemories ? 200.0 : 0.0);
    final topSliverWidget = showFilterControls || showMemoryLane
        ? SliverToBoxAdapter(
            child: Column(
              children: [
                if (showFilterControls) const _PhotosFilterControls(),
                if (showMemoryLane) const DriftMemoryLane(),
              ],
            ),
          )
        : null;

    final timeline = Timeline(
      topSliverWidget: topSliverWidget,
      topSliverWidgetHeight: topSliverHeight,
      showStorageIndicator: true,
      appBar: appBar,
    );

    return timeline;
  }
}

class _PhotosFilterControls extends ConsumerWidget {
  const _PhotosFilterControls();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final personFilter = ref.watch(personFilterProvider);
    final mediaTypeFilter = ref.watch(mediaTypeFilterProvider);
    final showOnlyPhotos = ref.watch(showOnlyPhotosProvider);
    final colorScheme = Theme.of(context).colorScheme;
    final labelStyle = Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600);

    return SizedBox(
      height: 52,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          children: [
            CupertinoSlidingSegmentedControl<PersonFilterType>(
              groupValue: personFilter,
              backgroundColor: colorScheme.surfaceContainerHighest,
              thumbColor: colorScheme.surface,
              children: {
                PersonFilterType.all: Text('Alle', style: labelStyle),
                PersonFilterType.chris: Text('Chris', style: labelStyle),
                PersonFilterType.rachel: Text('Rachel', style: labelStyle),
              },
              onValueChanged: (value) {
                if (value != null) {
                  ref.read(personFilterProvider.notifier).set(value);
                }
              },
            ),
            const SizedBox(width: 10),
            CupertinoSlidingSegmentedControl<MediaTypeFilterType>(
              groupValue: mediaTypeFilter,
              backgroundColor: colorScheme.surfaceContainerHighest,
              thumbColor: colorScheme.surface,
              children: const {
                MediaTypeFilterType.all: Tooltip(message: 'Alle Medien', child: Icon(Icons.perm_media_outlined)),
                MediaTypeFilterType.images: Tooltip(message: 'Bilder', child: Icon(Icons.image_outlined)),
                MediaTypeFilterType.videos: Tooltip(message: 'Videos', child: Icon(Icons.play_circle_outline_rounded)),
              },
              onValueChanged: (value) {
                if (value != null) {
                  ref.read(mediaTypeFilterProvider.notifier).set(value);
                }
              },
            ),
            const SizedBox(width: 4),
            Tooltip(
              message: 'Nur Fotos',
              child: IconButton(
                isSelected: showOnlyPhotos,
                onPressed: () => ref.read(showOnlyPhotosProvider.notifier).toggle(),
                selectedIcon: Icon(Icons.filter_alt_rounded, color: colorScheme.primary),
                icon: Icon(Icons.filter_alt_outlined, color: colorScheme.onSurfaceVariant),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
