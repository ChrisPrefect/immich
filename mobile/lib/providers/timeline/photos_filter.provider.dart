import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Built-in filter categories available in the Photos tab header dropdown.
/// Album filters are represented by [albumId] on the state; when set, the mode
/// is [PhotosFilterMode.album] and [albumId] identifies the target album.
enum PhotosFilterMode { all, favorites, videos, images, album }

class PhotosFilterState {
  final PhotosFilterMode mode;
  final String? albumId;

  const PhotosFilterState({this.mode = PhotosFilterMode.all, this.albumId});

  PhotosFilterState copyWith({PhotosFilterMode? mode, String? albumId, bool clearAlbumId = false}) {
    return PhotosFilterState(
      mode: mode ?? this.mode,
      albumId: clearAlbumId ? null : (albumId ?? this.albumId),
    );
  }
}

class PhotosFilterNotifier extends Notifier<PhotosFilterState> {
  @override
  PhotosFilterState build() => const PhotosFilterState();

  void reset() => state = const PhotosFilterState();

  void setMode(PhotosFilterMode mode) =>
      state = state.copyWith(mode: mode, clearAlbumId: mode != PhotosFilterMode.album);

  void setAlbum(String albumId) => state = PhotosFilterState(mode: PhotosFilterMode.album, albumId: albumId);
}

/// Filter state for the Photos tab. Not persisted — resets to "all" on app
/// restart (per user instruction).
final photosFilterProvider = NotifierProvider<PhotosFilterNotifier, PhotosFilterState>(PhotosFilterNotifier.new);
