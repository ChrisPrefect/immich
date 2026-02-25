import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/infrastructure/repositories/ocr.repository.dart';

class DriftOcrService {
  final DriftOcrRepository _repository;

  const DriftOcrService(this._repository);

  Future<DriftOcr?> get(String assetId) {
    return _repository.get(assetId);
  }
}
