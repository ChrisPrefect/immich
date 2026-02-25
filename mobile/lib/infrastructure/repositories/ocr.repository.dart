import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_ocr.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftOcrRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftOcrRepository(this._db) : super(_db);

  Future<DriftOcr?> get(String assetId) async {
    final query = _db.select(_db.assetOcrEntity)..where((row) => row.assetId.equals(assetId));

    final result = await query.getSingleOrNull();
    return result?.toDto();
  }
}

extension on AssetOcrEntityData {
  DriftOcr toDto() {
    return DriftOcr(
      id: id,
      assetId: assetId,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      x3: x3,
      y3: y3,
      x4: x4,
      y4: y4,
      boxScore: boxScore,
      textScore: textScore,
      text: recognizedText,
      isVisible: isVisible,
    );
  }
}
