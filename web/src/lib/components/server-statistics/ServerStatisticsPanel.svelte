<script lang="ts">
  import ServerStatisticsCard from '$lib/components/server-statistics/ServerStatisticsCard.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getBytesWithUnit } from '$lib/utils/byte-units';
  import type { ServerStatsResponseDto, UserAdminResponseDto } from '@immich/sdk';
  import {
    Code,
    FormatBytes,
    Icon,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
    Text,
  } from '@immich/ui';
  import { mdiCameraIris, mdiChartPie, mdiPlayCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    statsPromise: Promise<ServerStatsResponseDto>;
    users: UserAdminResponseDto[];
  };

  const { statsPromise, users }: Props = $props();
  let stats = $state<ServerStatsResponseDto | null>(null);

  $effect.pre(() => {
    void statsPromise.then((result) => {
      stats = result;
    });
  });

  const photosPromise = $derived.by(() => statsPromise.then((data) => ({ value: data.photos })));

  const videosPromise = $derived.by(() => statsPromise.then((data) => ({ value: data.videos })));

  const storagePromise = $derived.by(() =>
    statsPromise.then((data) => {
      const TiB = 1024 ** 4;
      const [value, unit] = getBytesWithUnit(data.usage, data.usage > TiB ? 2 : 0);
      return { value, unit };
    }),
  );

  const storageUsageWithUnit = $derived.by(() => {
    const TiB = 1024 ** 4;
    return stats ? getBytesWithUnit(stats.usage, stats.usage > TiB ? 2 : 0) : ([0, ''] as const);
  });

  const zeros = (value: number, maxLength = 13) => {
    const valueLength = value.toString().length;
    const zeroLength = maxLength - valueLength;

    return '0'.repeat(zeroLength);
  };
</script>

<div class="flex flex-col gap-5 my-4">
  <div>
    <Text class="mb-2" fontWeight="medium">{$t('total_usage')}</Text>

    <div class="hidden justify-between lg:flex gap-4">
      <ServerStatisticsCard icon={mdiCameraIris} title={$t('photos')} valuePromise={photosPromise} />
      <ServerStatisticsCard icon={mdiPlayCircle} title={$t('videos')} valuePromise={videosPromise} />
      <ServerStatisticsCard icon={mdiChartPie} title={$t('storage')} valuePromise={storagePromise} />
    </div>

    <div class="mt-5 flex lg:hidden">
      {#if stats}
        <div class="flex flex-col justify-between rounded-3xl bg-subtle p-5 dark:bg-immich-dark-gray">
          <div class="flex flex-wrap gap-x-12">
            <div class="flex flex-1 place-items-center gap-4 text-primary">
              <Icon icon={mdiCameraIris} size="25" />
              <Text size="medium" fontWeight="medium">{$t('photos')}</Text>
            </div>

            <div class="relative text-center font-mono text-2xl font-medium">
              <span class="text-light-300">{zeros(stats.photos)}</span><span class="text-primary">{stats.photos}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-x-12">
            <div class="flex flex-1 place-items-center gap-4 text-primary">
              <Icon icon={mdiPlayCircle} size="25" />
              <Text size="medium" fontWeight="medium">{$t('videos')}</Text>
            </div>

            <div class="relative text-center font-mono text-2xl font-medium">
              <span class="text-light-300">{zeros(stats.videos)}</span><span class="text-primary">{stats.videos}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-x-5">
            <div class="flex flex-1 flex-nowrap place-items-center gap-4 text-primary">
              <Icon icon={mdiChartPie} size="25" />
              <Text size="medium" fontWeight="medium">{$t('storage')}</Text>
            </div>

            <div class="relative flex text-center font-mono text-2xl font-medium">
              <span class="text-light-300">{zeros(storageUsageWithUnit[0])}</span><span class="text-primary"
                >{storageUsageWithUnit[0]}</span
              >

              <div class="absolute -end-1.5 -bottom-4">
                <Code color="muted" class="text-xs font-light font-mono">{storageUsageWithUnit[1]}</Code>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div>
    <Text class="mb-2 mt-4" fontWeight="medium">{$t('user_usage_detail')}</Text>
    <Table striped size="small">
      <TableHeader>
        <TableHeading class="w-1/4">{$t('user')}</TableHeading>
        <TableHeading class="w-1/4">{$t('photos')}</TableHeading>
        <TableHeading class="w-1/4">{$t('videos')}</TableHeading>
        <TableHeading class="w-1/4">{$t('usage')}</TableHeading>
      </TableHeader>
      <TableBody class="block max-h-80 overflow-y-auto">
        {#if stats}
          {#each stats.usageByUser as user (user.userId)}
            <TableRow>
              <TableCell class="w-1/4">{user.userName}</TableCell>
              <TableCell class="w-1/4">
                {user.photos.toLocaleString($locale)} (<FormatBytes bytes={user.usagePhotos} />)</TableCell
              >
              <TableCell class="w-1/4">
                {user.videos.toLocaleString($locale)} (<FormatBytes
                  bytes={user.usageVideos}
                  precision={0}
                />)</TableCell
              >
              <TableCell class="w-1/4">
                <FormatBytes bytes={user.usage} precision={0} />
                {#if user.quotaSizeInBytes !== null}
                  / <FormatBytes bytes={user.quotaSizeInBytes} precision={0} />
                {/if}
                <span class="text-primary">
                  {#if user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0}
                    ({(user.quotaSizeInBytes === 0 ? 1 : user.usage / user.quotaSizeInBytes).toLocaleString($locale, {
                      style: 'percent',
                      maximumFractionDigits: 0,
                    })})
                  {:else}
                    ({$t('unlimited')})
                  {/if}
                </span>
              </TableCell>
            </TableRow>
          {/each}
        {:else if users.length}
          {#each users as user (user.id)}
            <TableRow>
              <TableCell class="w-1/4">{user.name}</TableCell>
              <TableCell class="w-1/4"><span class="skeleton-loader inline-block h-4 w-16"></span></TableCell>
              <TableCell class="w-1/4"><span class="skeleton-loader inline-block h-4 w-16"></span></TableCell>
              <TableCell class="w-1/4"><span class="skeleton-loader inline-block h-4 w-24"></span></TableCell>
            </TableRow>
          {/each}
        {/if}
      </TableBody>
    </Table>
  </div>
</div>

<style>
  .skeleton-loader {
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    background-color: rgba(156, 163, 175, 0.35);
  }

  .skeleton-loader::after {
    content: '';
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0)
    );
    background-size: 200% 100%;
    background-position: 200% 0;
    animation: skeleton-animation 2000ms infinite;
  }

  @keyframes skeleton-animation {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
</style>
