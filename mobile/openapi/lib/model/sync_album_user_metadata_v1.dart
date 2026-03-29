//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAlbumUserMetadataV1 {
  /// Returns a new [SyncAlbumUserMetadataV1] instance.
  SyncAlbumUserMetadataV1({
    required this.albumId,
    required this.isFavorite,
    required this.userId,
  });

  /// Album ID
  String albumId;

  /// Is favorite
  bool isFavorite;

  /// User ID
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAlbumUserMetadataV1 &&
    other.albumId == albumId &&
    other.isFavorite == isFavorite &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (isFavorite.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SyncAlbumUserMetadataV1[albumId=$albumId, isFavorite=$isFavorite, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
      json[r'isFavorite'] = this.isFavorite;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SyncAlbumUserMetadataV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAlbumUserMetadataV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAlbumUserMetadataV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAlbumUserMetadataV1(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SyncAlbumUserMetadataV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAlbumUserMetadataV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAlbumUserMetadataV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAlbumUserMetadataV1> mapFromJson(dynamic json) {
    final map = <String, SyncAlbumUserMetadataV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAlbumUserMetadataV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAlbumUserMetadataV1-objects as value to a dart map
  static Map<String, List<SyncAlbumUserMetadataV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAlbumUserMetadataV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAlbumUserMetadataV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'isFavorite',
    'userId',
  };
}

