import 'package:immich_mobile/domain/models/store.model.dart';

enum Setting<T> {
  tilesPerRow<int>(StoreKey.tilesPerRow, 4),
  groupAssetsBy<int>(StoreKey.groupAssetsBy, 0),
  showStorageIndicator<bool>(StoreKey.storageIndicator, true),
  loadOriginal<bool>(StoreKey.loadOriginal, false),
  loadOriginalVideo<bool>(StoreKey.loadOriginalVideo, false),
  autoPlayVideo<bool>(StoreKey.autoPlayVideo, true),
  preferRemoteImage<bool>(StoreKey.preferRemoteImage, false),
  advancedTroubleshooting<bool>(StoreKey.advancedTroubleshooting, false),
  enableBackup<bool>(StoreKey.enableBackup, false),
  // ImmichPlus customizations (default true — the Immich+ behavior)
  reverseTimeline<bool>(StoreKey.reverseTimeline, true),
  hideAssetBadges<bool>(StoreKey.hideAssetBadges, true),
  hideMemoriesLane<bool>(StoreKey.hideMemoriesLane, true),
  showMemoriesFolder<bool>(StoreKey.showMemoriesFolder, true),
  scrollRestoreOnViewerClose<bool>(StoreKey.scrollRestoreOnViewerClose, true),
  placesDirectToMap<bool>(StoreKey.placesDirectToMap, true),
  logsShowAssetDetail<bool>(StoreKey.logsShowAssetDetail, true),
  syncIosFavorites<bool>(StoreKey.syncIosFavorites, true),
  syncIosHiddenToLockedFolder<bool>(StoreKey.syncIosHiddenToLockedFolder, true);

  const Setting(this.storeKey, this.defaultValue);

  final StoreKey<T> storeKey;
  final T defaultValue;
}
