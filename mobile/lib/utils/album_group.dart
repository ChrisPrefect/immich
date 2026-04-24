import 'package:immich_mobile/domain/models/album/album.model.dart';

/// Groups remote albums whose names match (case-insensitive, trimmed) into a
/// single [RemoteAlbumGroup]. Within each group the album with the newest
/// `updatedAt` is treated as the *primary* — that's the one shown in the UI
/// and the one new assets land in when a user adds to a "merged" name.
///
/// ImmichPlus reason: Chris' library regularly sees server-side duplicates
/// (sync re-creating an album, shared-with-me copies, Immich-LINE imports,
/// etc.). The user-facing contract is "one name, one album".
class RemoteAlbumGroup {
  final RemoteAlbum primary;
  final List<RemoteAlbum> duplicates;

  const RemoteAlbumGroup({required this.primary, required this.duplicates});

  /// All album ids in the group, including the primary. Useful for filter
  /// selection sets that need to match any of the underlying albums.
  Set<String> get ids => {primary.id, ...duplicates.map((a) => a.id)};

  int get totalAssetCount =>
      primary.assetCount + duplicates.fold<int>(0, (acc, a) => acc + a.assetCount);
}

String _normalize(String name) => name.trim().toLowerCase();

List<RemoteAlbumGroup> groupAlbumsByName(Iterable<RemoteAlbum> albums) {
  final byName = <String, List<RemoteAlbum>>{};
  for (final a in albums) {
    byName.putIfAbsent(_normalize(a.name), () => []).add(a);
  }
  final groups = byName.values.map((group) {
    final sorted = [...group]..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return RemoteAlbumGroup(primary: sorted.first, duplicates: sorted.sublist(1));
  }).toList();
  // Preserve the input order based on the primary album — caller decides the
  // overall sort (e.g. by updatedAt desc for the Albums tab, by name for the
  // settings checklist).
  return groups;
}
