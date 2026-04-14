<script lang="ts">
  import AssetLayout from '$lib/components/timeline/AssetLayout.svelte';
  import type { AssetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { TimelineDay } from '$lib/managers/timeline-manager/timeline-day.svelte';
  import type { TimelineMonth } from '$lib/managers/timeline-manager/timeline-month.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot, filterIsInOrNearViewport } from '$lib/managers/timeline-manager/utils.svelte';
  import type { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import { fromTimelinePlainDate, getDateLocaleString } from '$lib/utils/timeline-util';
  import { Icon } from '@immich/ui';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import type { Snippet } from 'svelte';

  type Props = {
    thumbnail: Snippet<
      [
        {
          asset: TimelineAsset;
          position: CommonPosition;
          timelineDay: TimelineDay;
          groupIndex: number;
        },
      ]
    >;
    customThumbnailLayout?: Snippet<[TimelineAsset]>;
    singleSelect: boolean;
    assetInteraction: AssetMultiSelectManager;
    timelineMonth: TimelineMonth;
    manager: VirtualScrollManager;
    onTimelineDaySelect: (timelineDay: TimelineDay, assets: TimelineAsset[]) => void;
  };
  let {
    thumbnail: thumbnailWithGroup,
    customThumbnailLayout,
    singleSelect,
    assetInteraction,
    timelineMonth,
    manager,
    onTimelineDaySelect,
  }: Props = $props();

  let { isUploading } = uploadAssetsStore;
  let hoveredTimelineDay = $state<string | null>(null);

  const transitionDuration = $derived(timelineMonth.timelineManager.suspendTransitions && !$isUploading ? 0 : 150);

  const getTimelineDayFullDate = (timelineDay: TimelineDay): string => {
    const { month, year } = timelineDay.timelineMonth.yearMonth;
    const date = fromTimelinePlainDate({
      year,
      month,
      day: timelineDay.day,
    });
    return getDateLocaleString(date);
  };
</script>

{#each filterIsInOrNearViewport(timelineMonth.timelineDays) as timelineDay, groupIndex (timelineDay.day)}
  {@const isTimelineDaySelected = assetInteraction.selectedGroup.has(timelineDay.groupTitle)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section
    class={[
      { 'transition-all': !timelineMonth.timelineManager.suspendTransitions },
      !timelineMonth.timelineManager.suspendTransitions && `delay-${transitionDuration}`,
    ]}
    data-group
    style:position="absolute"
    style:inset-inline-start={timelineDay.start + 'px'}
    style:top={timelineDay.top + 'px'}
    onmouseenter={() => (hoveredTimelineDay = timelineDay.groupTitle)}
    onmouseleave={() => (hoveredTimelineDay = null)}
  >
    <!-- Day title hidden (custom fork: no date grouping) -->

    <AssetLayout
      {manager}
      viewerAssets={timelineDay.viewerAssets}
      height={timelineDay.height}
      width={timelineDay.width}
      {customThumbnailLayout}
    >
      {#snippet thumbnail({ asset, position })}
        {@render thumbnailWithGroup({ asset, position, timelineDay, groupIndex })}
      {/snippet}
    </AssetLayout>
  </section>
{/each}

<style>
  section {
    contain: layout paint style;
  }
</style>
