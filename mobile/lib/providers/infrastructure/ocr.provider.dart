import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/domain/services/ocr.service.dart';
import 'package:immich_mobile/infrastructure/repositories/ocr.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final driftOcrRepositoryProvider = Provider<DriftOcrRepository>((ref) => DriftOcrRepository(ref.watch(driftProvider)));

final driftOcrServiceProvider = Provider<DriftOcrService>(
  (ref) => DriftOcrService(ref.watch(driftOcrRepositoryProvider)),
);

final driftOcrAssetProvider = FutureProvider.family<List<DriftOcr>?, String>((ref, assetId) async {
  final service = ref.watch(driftOcrServiceProvider);
  return service.get(assetId);
});
