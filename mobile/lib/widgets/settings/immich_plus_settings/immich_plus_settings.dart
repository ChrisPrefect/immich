import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart' as drift_album;
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/utils/album_group.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

/// ImmichPlus customizations hub. Every toggle here describes a fork-specific
/// behavior; defaults are ON so a fresh install gets the full Immich+
/// experience. Keep this file and `Immich iOS App CUSTOM_CHANGES.md` in sync.
class ImmichPlusSettings extends HookConsumerWidget {
  const ImmichPlusSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hideHeaderImage = useAppSettingsState(AppSettingsEnum.hideHeaderImage);
    final hideSyncNotifications = useAppSettingsState(AppSettingsEnum.hideSyncNotifications);
    final groupByIndex = useAppSettingsState(AppSettingsEnum.groupAssetsBy);
    final disableGrouping = useState(GroupAssetsBy.values[groupByIndex.value] == GroupAssetsBy.none);

    final reverseTimeline = useAppSettingsState(AppSettingsEnum.reverseTimeline);
    final hideAssetBadges = useAppSettingsState(AppSettingsEnum.hideAssetBadges);
    final hideMemoriesLane = useAppSettingsState(AppSettingsEnum.hideMemoriesLane);
    final showMemoriesFolder = useAppSettingsState(AppSettingsEnum.showMemoriesFolder);
    final scrollRestoreOnViewerClose = useAppSettingsState(AppSettingsEnum.scrollRestoreOnViewerClose);
    final placesDirectToMap = useAppSettingsState(AppSettingsEnum.placesDirectToMap);
    final logsShowAssetDetail = useAppSettingsState(AppSettingsEnum.logsShowAssetDetail);
    final syncIosFavorites = useAppSettingsState(AppSettingsEnum.syncIosFavorites);
    final syncIosHiddenToLockedFolder = useAppSettingsState(AppSettingsEnum.syncIosHiddenToLockedFolder);
    final hiddenAssetIdsAsync = CurrentPlatform.isIOS && syncIosHiddenToLockedFolder.value
        ? ref.watch(iosHiddenAssetIdsProvider)
        : const AsyncData(<String>[]);

    void invalidateSettings(bool _) {
      ref.invalidate(appSettingsServiceProvider);
      ref.invalidate(settingsProvider);
    }

    /// Forces a full timeline rebuild so changes to reverse/grouping/etc.
    /// land in the UI even when the reactive chain misses (e.g. services that
    /// read the setting eagerly on construction and then cache).
    void invalidateTimeline(bool value) {
      invalidateSettings(value);
      ref.invalidate(timelineFactoryProvider);
      ref.invalidate(timelineServiceProvider);
    }

    void onDisableGroupingChanged(bool value) {
      groupByIndex.value = (value ? GroupAssetsBy.none : GroupAssetsBy.day).index;
      invalidateTimeline(value);
    }

    void onSyncIosHiddenChanged(bool value) {
      invalidateSettings(value);
      if (!CurrentPlatform.isIOS) {
        return;
      }

      unawaited(() async {
        await ref.read(nativeSyncApiProvider).clearSyncCheckpoint();
        ref.invalidate(iosHiddenAssetIdsProvider);
      }());
    }

    final uiToggles = [
      SettingsSwitchListTile(
        valueNotifier: hideHeaderImage,
        title: 'immich_plus_hide_header_image_title'.tr(),
        subtitle: 'immich_plus_hide_header_image_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: hideAssetBadges,
        title: 'immich_plus_hide_asset_badges_title'.tr(),
        subtitle: 'immich_plus_hide_asset_badges_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: hideMemoriesLane,
        title: 'immich_plus_hide_memories_lane_title'.tr(),
        subtitle: 'immich_plus_hide_memories_lane_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: showMemoriesFolder,
        title: 'immich_plus_show_memories_folder_title'.tr(),
        subtitle: 'immich_plus_show_memories_folder_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: scrollRestoreOnViewerClose,
        title: 'immich_plus_scroll_restore_title'.tr(),
        subtitle: 'immich_plus_scroll_restore_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: placesDirectToMap,
        title: 'immich_plus_places_direct_to_map_title'.tr(),
        subtitle: 'immich_plus_places_direct_to_map_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: reverseTimeline,
        title: 'immich_plus_reverse_timeline_title'.tr(),
        subtitle: 'immich_plus_reverse_timeline_subtitle'.tr(),
        onChanged: invalidateTimeline,
      ),
      SettingsSwitchListTile(
        valueNotifier: hideSyncNotifications,
        title: 'immich_plus_hide_sync_notifications_title'.tr(),
        subtitle: 'immich_plus_hide_sync_notifications_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: disableGrouping,
        title: 'immich_plus_disable_grouping_title'.tr(),
        subtitle: 'immich_plus_disable_grouping_subtitle'.tr(),
        onChanged: onDisableGroupingChanged,
      ),
      SettingsSwitchListTile(
        valueNotifier: logsShowAssetDetail,
        title: 'immich_plus_logs_asset_detail_title'.tr(),
        subtitle: 'immich_plus_logs_asset_detail_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
    ];

    final dataToggles = [
      SettingsSwitchListTile(
        valueNotifier: syncIosFavorites,
        title: 'immich_plus_sync_ios_favorites_title'.tr(),
        subtitle: 'immich_plus_sync_ios_favorites_subtitle'.tr(),
        onChanged: invalidateSettings,
      ),
      SettingsSwitchListTile(
        valueNotifier: syncIosHiddenToLockedFolder,
        title: 'immich_plus_sync_ios_hidden_title'.tr(),
        subtitle: 'immich_plus_sync_ios_hidden_subtitle'.tr(),
        onChanged: onSyncIosHiddenChanged,
      ),
    ];

    return SettingsSubPageScaffold(
      settings: [
        SettingGroupTitle(title: 'immich_plus_group_ui'.tr(), icon: Icons.style_outlined),
        ...uiToggles,
        const SizedBox(height: 24),
        SettingGroupTitle(title: 'immich_plus_group_sync'.tr(), icon: Icons.sync_alt_rounded),
        ...dataToggles,
        if (CurrentPlatform.isIOS && syncIosHiddenToLockedFolder.value)
          hiddenAssetIdsAsync.when(
            data: (hiddenIds) => hiddenIds.isEmpty ? const _IosHiddenSyncHelpCard() : const SizedBox.shrink(),
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),
        const SizedBox(height: 16),
        const _PhotosFilterAlbumsSection(),
      ],
    );
  }
}

class _IosHiddenSyncHelpCard extends ConsumerWidget {
  const _IosHiddenSyncHelpCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.lock_open_rounded, color: context.primaryColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'immich_plus_sync_ios_hidden_empty_title'.tr(),
                      style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'immich_plus_sync_ios_hidden_empty_subtitle'.tr(),
                style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => ref.invalidate(iosHiddenAssetIdsProvider),
                icon: const Icon(Icons.refresh_rounded),
                label: Text('refresh'.tr()),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Multi-select list for the Photos tab filter-menu custom-albums feature.
/// Persists the selection as a comma-separated list of album IDs in
/// [StoreKey.photosFilterAlbumIds].
class _PhotosFilterAlbumsSection extends HookConsumerWidget {
  const _PhotosFilterAlbumsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ImmichPlus: collapse same-named albums into one checklist entry, drop
    // empty ones, sort alphabetically. A single checkbox controls all
    // underlying IDs so that ticking "Sommer" persists every "Sommer"
    // duplicate at once — matches the Photos-tab filter behaviour.
    final groups =
        groupAlbumsByName(
            ref.watch(drift_album.remoteAlbumProvider).albums,
          ).where((g) => g.totalAssetCount > 0).toList()
          ..sort((a, b) => a.primary.name.toLowerCase().compareTo(b.primary.name.toLowerCase()));
    final raw = useState(Store.tryGet(StoreKey.photosFilterAlbumIds) ?? '');
    final selected = raw.value.split(',').where((s) => s.isNotEmpty).toSet();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            'immich_plus_filter_albums_title'.tr(),
            style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
          child: Text(
            'immich_plus_filter_albums_subtitle'.tr(),
            style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
          ),
        ),
        if (groups.isEmpty)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'immich_plus_filter_albums_empty'.tr(),
              style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
            ),
          )
        else
          ...groups.map((group) {
            final isOn = group.ids.any(selected.contains);
            final count = group.totalAssetCount;
            final subtitle = group.duplicates.isEmpty
                ? '${group.primary.ownerName} · $count'
                : '${group.primary.ownerName} · $count · +${group.duplicates.length}';
            return CheckboxListTile(
              title: Text(group.primary.name),
              subtitle: Text(subtitle),
              value: isOn,
              onChanged: (v) async {
                final next = {...selected};
                if (v == true) {
                  next.addAll(group.ids);
                } else {
                  next.removeAll(group.ids);
                }
                await Store.put(StoreKey.photosFilterAlbumIds, next.join(','));
                raw.value = next.join(',');
              },
            );
          }),
      ],
    );
  }
}
