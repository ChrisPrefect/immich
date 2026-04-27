import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/filter/filter_types.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

T _enumFromIndex<T>(List<T> values, int index, T fallback) {
  if (index < 0 || index >= values.length) {
    return fallback;
  }
  return values[index];
}

class PersonFilterNotifier extends Notifier<PersonFilterType> {
  @override
  PersonFilterType build() {
    final index = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.personFilter);
    return _enumFromIndex(PersonFilterType.values, index, PersonFilterType.all);
  }

  void set(PersonFilterType value) {
    state = value;
    unawaited(ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.personFilter, value.index));
  }
}

class MediaTypeFilterNotifier extends Notifier<MediaTypeFilterType> {
  @override
  MediaTypeFilterType build() {
    final index = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.mediaTypeFilter);
    return _enumFromIndex(MediaTypeFilterType.values, index, MediaTypeFilterType.all);
  }

  void set(MediaTypeFilterType value) {
    state = value;
    unawaited(ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.mediaTypeFilter, value.index));
  }
}

class ShowOnlyPhotosNotifier extends Notifier<bool> {
  @override
  bool build() => ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.showOnlyPhotos);

  void set(bool value) {
    state = value;
    unawaited(ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.showOnlyPhotos, value));
  }

  void toggle() => set(!state);
}

final personFilterProvider = NotifierProvider<PersonFilterNotifier, PersonFilterType>(PersonFilterNotifier.new);
final mediaTypeFilterProvider = NotifierProvider<MediaTypeFilterNotifier, MediaTypeFilterType>(
  MediaTypeFilterNotifier.new,
);
final showOnlyPhotosProvider = NotifierProvider<ShowOnlyPhotosNotifier, bool>(ShowOnlyPhotosNotifier.new);
