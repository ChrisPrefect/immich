import { pluginManager } from '$lib/managers/plugin-manager.svelte';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getWorkflow } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url, params }) => {
  await authenticate(url);
  const [workflow] = await Promise.all([getWorkflow({ id: params.workflowId }), pluginManager.ready()]);
  const $t = await getFormatter();

  return {
    workflow,
    meta: {
      title: $t('edit_workflow'),
    },
  };
}) satisfies PageLoad;
