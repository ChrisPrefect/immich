import 'package:immich_mobile/domain/services/ocr.service.dart';
import 'package:immich_mobile/infrastructure/repositories/ocr.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final driftOcrRepositoryProvider = Provider<DriftOcrRepository>((ref) => DriftOcrRepository(ref.watch(driftProvider)));

final driftOcrServiceProvider = Provider<DriftOcrService>(
  (ref) => DriftOcrService(ref.watch(driftOcrRepositoryProvider)),
);
