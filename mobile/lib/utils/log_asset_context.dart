import 'package:immich_mobile/domain/models/log.model.dart';

/// ImmichPlus: helpers to embed and recover asset context in log messages so
/// the log detail page can deep-link into the responsible asset. The log
/// schema is not extended; we encode a simple sentinel in the message text.
class LogAssetContext {
  static const _assetIdTag = '[ASSET_ID:';
  static const _assetPathTag = '[ASSET_PATH:';
  static const _closeTag = ']';

  /// Build a trailing context string to append to a log message. Example:
  ///   log.severe('Upload failed' + LogAssetContext.format(id: id, path: p));
  static String format({String? id, String? path}) {
    final parts = <String>[];
    if (id != null && id.isNotEmpty) parts.add('$_assetIdTag$id$_closeTag');
    if (path != null && path.isNotEmpty) parts.add('$_assetPathTag$path$_closeTag');
    return parts.isEmpty ? '' : ' ${parts.join(' ')}';
  }

  /// Extract `(assetId, assetPath)` from a [LogMessage] by scanning `message`
  /// and `error` for the sentinel tags. Returns `(null, null)` if absent.
  static ({String? assetId, String? assetPath}) extract(LogMessage log) {
    final haystack = '${log.message}\n${log.error ?? ''}';
    return (
      assetId: _parseBetween(haystack, _assetIdTag, _closeTag),
      assetPath: _parseBetween(haystack, _assetPathTag, _closeTag),
    );
  }

  static String? _parseBetween(String haystack, String open, String close) {
    final start = haystack.indexOf(open);
    if (start < 0) return null;
    final valueStart = start + open.length;
    final end = haystack.indexOf(close, valueStart);
    if (end < 0) return null;
    final value = haystack.substring(valueStart, end).trim();
    return value.isEmpty ? null : value;
  }
}
