import 'package:immich_mobile/domain/utils/event_stream.dart';

// Timeline Events
class TimelineReloadEvent extends Event {
  const TimelineReloadEvent();
}

class ScrollToTopEvent extends Event {
  const ScrollToTopEvent();
}

class ScrollToDateEvent extends Event {
  final DateTime date;

  const ScrollToDateEvent(this.date);
}

/// Asks the active Timeline to scroll so that the asset at [index] is roughly
/// centered in the viewport. Emitted when the asset viewer closes, so the
/// gallery behind lines up with the last viewed asset (ImmichPlus feature).
class RestoreAssetIndexEvent extends Event {
  final int index;
  const RestoreAssetIndexEvent(this.index);
}

/// Asks the active Timeline to jump to the very bottom (newest asset) once the
/// next bucket load completes. Used by the Immich+ "Sortierung umkehren"
/// feature so every view — main timeline, filter switch, album, archive,
/// place/person — opens on the freshest asset, like iOS Photos.
class ScrollToBottomEvent extends Event {
  const ScrollToBottomEvent();
}

// Asset Viewer Events
class ViewerShowDetailsEvent extends Event {
  const ViewerShowDetailsEvent();
}

class ViewerReloadAssetEvent extends Event {
  const ViewerReloadAssetEvent();
}

// Multi-Select Events
class MultiSelectToggleEvent extends Event {
  final bool isEnabled;
  const MultiSelectToggleEvent(this.isEnabled);
}

// Map Events
class MapMarkerReloadEvent extends Event {
  const MapMarkerReloadEvent();
}
