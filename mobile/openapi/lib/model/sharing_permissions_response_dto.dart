//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharingPermissionsResponseDto {
  /// Returns a new [SharingPermissionsResponseDto] instance.
  SharingPermissionsResponseDto({
    this.permissions = const [],
  });

  /// Sharing permissions
  List<SharingPermission> permissions;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharingPermissionsResponseDto &&
    _deepEquality.equals(other.permissions, permissions);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (permissions.hashCode);

  @override
  String toString() => 'SharingPermissionsResponseDto[permissions=$permissions]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'permissions'] = this.permissions;
    return json;
  }

  /// Returns a new [SharingPermissionsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharingPermissionsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SharingPermissionsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharingPermissionsResponseDto(
        permissions: SharingPermission.listFromJson(json[r'permissions']),
      );
    }
    return null;
  }

  static List<SharingPermissionsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharingPermissionsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharingPermissionsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharingPermissionsResponseDto> mapFromJson(dynamic json) {
    final map = <String, SharingPermissionsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharingPermissionsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharingPermissionsResponseDto-objects as value to a dart map
  static Map<String, List<SharingPermissionsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharingPermissionsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharingPermissionsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'permissions',
  };
}

