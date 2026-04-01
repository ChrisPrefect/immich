<script lang="ts">
  import { getOwnAlbumUser, SharingPermission, updateOwnAlbumUser } from '@immich/sdk';
  import { Checkbox, Field, FormModal, Stack, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';

  type Props = {
    onClose: () => void;
    albumId?: string;
    partnerId?: string;
  };

  const { onClose, ...rest }: Props = $props();

  let checkedPermissions = $state<SharingPermission[]>([]);

  const onCheckedChange = (permission: SharingPermission, checked: boolean) => {
    if (checked) {
      checkedPermissions.push(permission);
    } else {
      checkedPermissions = checkedPermissions.filter((perm) => perm !== permission);
    }
  };

  const onSubmit = async () => {
    const permissions =
      checkedPermissions.length === Object.values(SharingPermission).length - 1
        ? [SharingPermission.All]
        : checkedPermissions;
    if (rest.albumId) {
      await updateOwnAlbumUser({ id: rest.albumId, updateSharingPermissions: { permissions } });
      toastManager.success();
    }
    onClose();
  };

  onMount(async () => {
    if (rest.albumId) {
      const { permissions } = await getOwnAlbumUser({ id: rest.albumId });
      checkedPermissions = permissions;
    }
  });
</script>

<FormModal title="Sharing permissions" {onClose} {onSubmit}>
  <Stack>
    <Field label={SharingPermission.All}>
      <Checkbox
        id="permission-{SharingPermission.All}"
        checked={checkedPermissions.length === Object.values(SharingPermission).length - 1}
        onCheckedChange={(checked) =>
          checked
            ? (checkedPermissions = Object.values(SharingPermission).filter(
                (permission) => permission !== SharingPermission.All,
              ))
            : (checkedPermissions = [])}
      />
    </Field>
    {#each Object.values(SharingPermission).filter((permission) => permission !== SharingPermission.All) as permission (permission)}
      <Field label={permission}>
        <Checkbox
          id="permission-{permission}"
          checked={checkedPermissions.includes(permission)}
          onCheckedChange={(checked) => onCheckedChange(permission, checked)}
        />
      </Field>
    {/each}
  </Stack>
</FormModal>
