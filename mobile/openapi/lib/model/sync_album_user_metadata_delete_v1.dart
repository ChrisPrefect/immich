//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAlbumUserMetadataDeleteV1 {
  /// Returns a new [SyncAlbumUserMetadataDeleteV1] instance.
  SyncAlbumUserMetadataDeleteV1({
    required this.albumId,
    required this.userId,
  });

  /// Album ID
  String albumId;

  /// User ID
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAlbumUserMetadataDeleteV1 &&
    other.albumId == albumId &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SyncAlbumUserMetadataDeleteV1[albumId=$albumId, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SyncAlbumUserMetadataDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAlbumUserMetadataDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAlbumUserMetadataDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAlbumUserMetadataDeleteV1(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SyncAlbumUserMetadataDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAlbumUserMetadataDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAlbumUserMetadataDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAlbumUserMetadataDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncAlbumUserMetadataDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAlbumUserMetadataDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAlbumUserMetadataDeleteV1-objects as value to a dart map
  static Map<String, List<SyncAlbumUserMetadataDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAlbumUserMetadataDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAlbumUserMetadataDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'userId',
  };
}

