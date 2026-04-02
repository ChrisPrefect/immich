<script lang="ts">
  import { keyboardManager } from '$lib/managers/keyboard.manager.svelte';
  import { CommandPaletteDefaultProvider, Icon, type ActionItem } from '@immich/ui';
  import {
    mdiAppleKeyboardCaps,
    mdiAppleKeyboardShift,
    mdiArrowDown,
    mdiArrowLeft,
    mdiArrowRight,
    mdiArrowUp,
    mdiKeyboard,
    mdiKeyboardReturn,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let keys = $derived(keyboardManager.keys);

  onMount(() => {
    const interval = setInterval(() => keyboardManager.onTick(), 250);
    return () => clearInterval(interval);
  });

  const ShowKeys: ActionItem = {
    title: $t('show_keys_title'),
    description: $t('show_keys_description'),
    icon: mdiKeyboard,
    onAction: () => keyboardManager.toggle(),
  };

  const getIcon = (key: string) => {
    switch (key) {
      case 'ArrowLeft': {
        return mdiArrowLeft;
      }
      case 'ArrowRight': {
        return mdiArrowRight;
      }
      case 'ArrowUp': {
        return mdiArrowUp;
      }
      case 'ArrowDown': {
        return mdiArrowDown;
      }
      case 'Enter': {
        return mdiKeyboardReturn;
      }
      case 'Shift': {
        return mdiAppleKeyboardShift;
      }
      case 'CapsLock': {
        return mdiAppleKeyboardCaps;
      }
    }
  };
</script>

<CommandPaletteDefaultProvider actions={[ShowKeys]} />

{#if keys.length > 0}
  <div class="absolute top-[50%] right-[50%] p-12 translate-x-[50%] bg-light-200/75 z-1000 rounded-xl">
    <div class="flex gap-1 text-4xl dark">
      {#each keys as key, i (i)}
        {@const icon = getIcon(key)}
        <span class="bg-light-400 text-light-900 py-2 px-4 rounded border">
          {#if icon}
            <Icon {icon} />
          {:else}
            {key}
          {/if}
        </span>
      {/each}
    </div>
  </div>
{/if}
