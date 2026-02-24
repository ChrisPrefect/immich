<script lang="ts">
  import { ByteUnit } from '$lib/utils/byte-units';
  import { Icon, Text } from '@immich/ui';

  interface ValueData {
    value: number;
    unit?: ByteUnit | undefined;
  }

  interface Props {
    icon: string;
    title: string;
    valuePromise: Promise<ValueData>;
  }

  let { icon, title, valuePromise }: Props = $props();
  let isLoading = $state(true);
  let data = $state<ValueData | null>(null);

  $effect.pre(() => {
    isLoading = true;
    void valuePromise.then((result) => {
      data = result;
      isLoading = false;
    });
  });

  const zeros = $derived(() => {
    const maxLength = 13;
    if (!data) {
      return '0'.repeat(maxLength);
    }
    const valueLength = data.value.toString().length;
    const zeroLength = maxLength - valueLength;
    return '0'.repeat(zeroLength);
  });
</script>

<div class="flex h-35 w-full flex-col justify-between rounded-3xl bg-subtle text-primary p-5">
  <div class="flex place-items-center gap-4">
    <Icon {icon} size="40" />
    <Text size="giant" fontWeight="medium">{title}</Text>
  </div>

  <div class="mx-auto font-mono text-2xl font-medium relative">
    <span class="text-gray-300 dark:text-gray-600" class:shimmer-text={isLoading}>{zeros()}</span
    >{#if !isLoading && data}<span>{data.value}</span>
      {#if data.unit}<code class="font-mono text-base font-normal">{data.unit}</code>{/if}{/if}
  </div>
</div>

<style>
  .shimmer-text {
    mask-image: linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 1) 100%);
    mask-size: 200% 100%;
    animation: shimmer 2.25s infinite linear;
  }

  @keyframes shimmer {
    from {
      mask-position: 200% 0;
    }
    to {
      mask-position: -200% 0;
    }
  }
</style>
