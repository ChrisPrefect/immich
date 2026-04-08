import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Ring buffer histogram for performance profiling.
class Histogram<T extends Enum> {
  final int _stride;
  final int _strideMask;
  final List<T> _values;
  final Int64List _counts;
  final Int64List _data;
  final Stopwatch _clock;
  static final _log = Logger('Histogram');

  Histogram({required int maxSamples, required List<T> values})
    : assert(maxSamples & (maxSamples - 1) == 0, 'maxSamples must be power of 2'),
      _stride = maxSamples,
      _strideMask = maxSamples - 1,
      _values = values,
      _counts = Int64List(values.length),
      _data = Int64List(maxSamples * values.length * 6),
      _clock = Stopwatch()..start();

  @pragma("vm:prefer-inline")
  @pragma("vm:unsafe:no-bounds-checks")
  void record(T type, int microseconds, int topLeft, int bottomRight, int contextHeight, int id) {
    final i = type.index;
    final count = _counts[i];
    final slot = count & _strideMask;

    final offset = (i * _stride + slot) * 6;
    _data[offset] = microseconds;
    _data[offset + 1] = _clock.elapsedMicroseconds;
    _data[offset + 2] = topLeft;
    _data[offset + 3] = bottomRight;
    _data[offset + 4] = contextHeight;
    _data[offset + 5] = id;
    _counts[i] = count + 1;
  }

  int count(T type) => _counts[type.index].clamp(0, _stride);

  int get maxSamples => _stride;

  @pragma("vm:unsafe:no-bounds-checks")
  void log(T type) {
    final index = type.index;
    final total = _counts[index];
    final count = min(total, _stride);
    if (count == 0) return;

    final baseOffset = index * _stride * 6;
    final scratch = Int64List(count);

    for (int i = 0; i < count; i++) {
      scratch[i] = _data[baseOffset + i * 6];
    }
    scratch.sort();

    int sum = 0;
    for (int i = 0; i < count; i++) {
      sum += scratch[i];
    }

    _log.info(
      '${type.name} (n=$total, sampled=$count) - '
      'Avg: ${(sum / count / 1000.0).toStringAsFixed(2)}ms, '
      'Min: ${(scratch[0] / 1000.0).toStringAsFixed(2)}ms, '
      'Max: ${(scratch[count - 1] / 1000.0).toStringAsFixed(2)}ms, '
      'P25: ${(_percentile(scratch, count, 0.25) / 1000.0).toStringAsFixed(2)}ms, '
      'P50: ${(_percentile(scratch, count, 0.50) / 1000.0).toStringAsFixed(2)}ms, '
      'P75: ${(_percentile(scratch, count, 0.75) / 1000.0).toStringAsFixed(2)}ms, '
      'P90: ${(_percentile(scratch, count, 0.90) / 1000.0).toStringAsFixed(2)}ms, '
      'P95: ${(_percentile(scratch, count, 0.95) / 1000.0).toStringAsFixed(2)}ms, '
      'P99: ${(_percentile(scratch, count, 0.99) / 1000.0).toStringAsFixed(2)}ms',
    );
  }

  void logAll() {
    for (final value in _values) {
      log(value);
    }
  }

  @pragma("vm:unsafe:no-bounds-checks")
  (Int64List, Int64List, Int64List, Int64List, Int64List, Int64List) getSamples(T type) {
    final index = type.index;
    final count = min(_counts[index], _stride);
    final samples = Int64List(count);
    final timestamps = Int64List(count);
    final topLeft = Int64List(count);
    final bottomRight = Int64List(count);
    final contextHeight = Int64List(count);
    final id = Int64List(count);

    final baseOffset = index * _stride * 6;
    for (int i = 0; i < count; i++) {
      samples[i] = _data[baseOffset + i * 6];
      timestamps[i] = _data[baseOffset + i * 6 + 1];
      topLeft[i] = _data[baseOffset + i * 6 + 2];
      bottomRight[i] = _data[baseOffset + i * 6 + 3];
      contextHeight[i] = _data[baseOffset + i * 6 + 4];
      id[i] = _data[baseOffset + i * 6 + 5];
    }
    return (samples, timestamps, topLeft, bottomRight, contextHeight, id);
  }

  @pragma("vm:unsafe:no-bounds-checks")
  Future<File> save({bool share = true}) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
    final file = File('${dir.path}/samples_$timestamp.json');

    final data = {};
    for (int i = 0; i < _counts.length; i++) {
      final name = _values[i].name;
      final (samples, timestamps, topLeft, bottomRight, contextHeight, id) = getSamples(_values[i]);
      data['${name}_us'] = samples;
      data['${name}_ts'] = timestamps;
      data['${name}_top_left'] = topLeft;
      data['${name}_bottom_right'] = bottomRight;
      data['${name}_context_height'] = contextHeight;
      data['${name}_id'] = id;
    }
    data['timestamp'] = DateTime.now().toIso8601String();
    await file.writeAsString(jsonEncode(data));
    _log.info('Saved samples to ${file.path}');

    if (share) {
      await Share.shareXFiles([XFile(file.path)]);
    }

    return file;
  }

  void reset(T type) {
    _counts[type.index] = 0;
  }

  void resetAll() {
    _counts.fillRange(0, _counts.length, 0);
  }

  @pragma("vm:prefer-inline")
  int _percentile(Int64List sorted, int count, double p) {
    final idx = ((count - 1) * p).round();
    return sorted[idx];
  }
}
