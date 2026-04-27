import 'package:immich_mobile/entities/asset.entity.dart';

class BackupCandidate {
  BackupCandidate({required this.asset, required this.albumNames, this.albumIds = const []});

  Asset asset;
  List<String> albumNames;
  List<String> albumIds;

  @override
  int get hashCode => asset.hashCode;

  @override
  bool operator ==(Object other) {
    if (other is! BackupCandidate) {
      return false;
    }
    return asset == other.asset;
  }
}
