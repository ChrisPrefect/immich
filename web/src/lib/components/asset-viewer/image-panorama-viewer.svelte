<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAssetTileUrl, getAssetUrl } from '$lib/utils';
  import { AssetMediaSize, viewAsset, type AssetResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
  };

  let { asset }: Props = $props();

  const assetId = $derived(asset.id);

  // TODO: get this via asset.tiles or whatever through the API
  const tileconfig = $derived.by(() => {
    // Get the number of tiles at the exact target size, rounded up (to at least 1 tile).
    const numTilesExact = Math.ceil(asset.exifInfo?.exifImageWidth! / 1024);
    // Then round up to the nearest power of 2 (photo-sphere-viewer requirement).
    const numTiles = Math.pow(2, Math.ceil(Math.log2(numTilesExact)));
    return {
      width: asset.exifInfo?.exifImageWidth!,
      cols: numTiles,
      rows: numTiles / 2,
    }
  });

  const loadAssetData = async (id: string) => {
    const data = await viewAsset({ ...authManager.params, id, size: AssetMediaSize.Preview });
    return URL.createObjectURL(data);
  };

  // TODO: determine whether to return null based on 1. if asset has tiles, 2. if tile is inside 'cropped' bounds.
  const tileUrl = (col: number, row: number, level: number) =>
    tileconfig ? getAssetTileUrl({ id: asset.id, level, col, row, cacheKey: asset.thumbhash }) : null;
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#await Promise.all([loadAssetData(assetId), import('./photo-sphere-viewer-adapter.svelte')])}
    <LoadingSpinner />
  {:then [data, { default: PhotoSphereViewer }]}
    <PhotoSphereViewer
      baseUrl={data}
      {tileUrl}
      {tileconfig}
      originalPanorama={getAssetUrl({ asset, forceOriginal: true })}
    />
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
