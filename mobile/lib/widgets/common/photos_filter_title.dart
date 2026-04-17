import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/timeline/photos_filter.provider.dart';

/// Clickable label in the Photos tab header showing the active filter
/// (e.g. "Alle", "Favoriten", an album name). Tapping opens a bottom sheet
/// with the built-in filter categories plus any remote albums the user picked
/// in Immich+ settings (stored as a comma-separated list of album IDs in
/// [StoreKey.photosFilterAlbumIds]).
class PhotosFilterTitle extends ConsumerWidget {
  const PhotosFilterTitle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(photosFilterProvider);
    final albums = ref.watch(remoteAlbumProvider).albums;
    String? selectedAlbumName;
    if (filter.mode == PhotosFilterMode.album && filter.albumId != null) {
      for (final a in albums) {
        if (a.id == filter.albumId) {
          selectedAlbumName = a.name;
          break;
        }
      }
    }

    final label = switch (filter.mode) {
      PhotosFilterMode.all => 'photos_filter_all'.t(context: context),
      PhotosFilterMode.favorites => 'photos_filter_favorites'.t(context: context),
      PhotosFilterMode.videos => 'photos_filter_videos'.t(context: context),
      PhotosFilterMode.images => 'photos_filter_images'.t(context: context),
      PhotosFilterMode.album => selectedAlbumName ?? 'photos_filter_all'.t(context: context),
    };

    return InkWell(
      onTap: () => _openSheet(context, ref),
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: context.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
            const Icon(Icons.keyboard_arrow_down_rounded),
          ],
        ),
      ),
    );
  }

  void _openSheet(BuildContext context, WidgetRef ref) {
    final albums = ref.read(remoteAlbumProvider).albums;
    final configuredIds = (Store.tryGet(StoreKey.photosFilterAlbumIds) ?? '').split(',').where((s) => s.isNotEmpty).toSet();
    final filterAlbums = albums.where((a) => configuredIds.contains(a.id)).toList();
    final current = ref.read(photosFilterProvider);

    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _FilterRow(
              icon: Icons.photo_library_outlined,
              label: 'photos_filter_all'.tr(),
              selected: current.mode == PhotosFilterMode.all,
              onTap: () {
                ref.read(photosFilterProvider.notifier).setMode(PhotosFilterMode.all);
                Navigator.of(ctx).pop();
              },
            ),
            _FilterRow(
              icon: Icons.favorite_outline_rounded,
              label: 'photos_filter_favorites'.tr(),
              selected: current.mode == PhotosFilterMode.favorites,
              onTap: () {
                ref.read(photosFilterProvider.notifier).setMode(PhotosFilterMode.favorites);
                Navigator.of(ctx).pop();
              },
            ),
            _FilterRow(
              icon: Icons.play_circle_outline_rounded,
              label: 'photos_filter_videos'.tr(),
              selected: current.mode == PhotosFilterMode.videos,
              onTap: () {
                ref.read(photosFilterProvider.notifier).setMode(PhotosFilterMode.videos);
                Navigator.of(ctx).pop();
              },
            ),
            _FilterRow(
              icon: Icons.image_outlined,
              label: 'photos_filter_images'.tr(),
              selected: current.mode == PhotosFilterMode.images,
              onTap: () {
                ref.read(photosFilterProvider.notifier).setMode(PhotosFilterMode.images);
                Navigator.of(ctx).pop();
              },
            ),
            if (filterAlbums.isNotEmpty) const Divider(),
            ...filterAlbums.map(
              (album) => _FilterRow(
                icon: Icons.photo_album_outlined,
                label: album.name,
                selected: current.mode == PhotosFilterMode.album && current.albumId == album.id,
                onTap: () {
                  ref.read(photosFilterProvider.notifier).setAlbum(album.id);
                  Navigator.of(ctx).pop();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({required this.icon, required this.label, required this.selected, required this.onTap});

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: selected ? context.primaryColor : null),
      title: Text(label, style: TextStyle(color: selected ? context.primaryColor : null)),
      trailing: selected ? Icon(Icons.check, color: context.primaryColor) : null,
      onTap: onTap,
    );
  }
}

