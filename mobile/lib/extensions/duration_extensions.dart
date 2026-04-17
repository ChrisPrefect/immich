extension TZOffsetExtension on Duration {
  /// Formats the duration in the format of ±HH:MM
  String formatAsOffset() =>
      "${isNegative ? '-' : '+'}${inHours.abs().toString().padLeft(2, '0')}:${inMinutes.abs().remainder(60).toString().padLeft(2, '0')}";
}

extension DurationFormatExtension on Duration {
  String format() {
    final seconds = inSeconds.remainder(60).toString().padLeft(2, '0');
    if (inHours == 0) {
      final minutes = inMinutes.remainder(60).toString();
      return "$minutes:$seconds";
    }
    final minutes = inMinutes.remainder(60).toString().padLeft(2, '0');
    final hours = inHours.toString();
    return "$hours:$minutes:$seconds";
  }
}
