import 'package:async/async.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

RestartableTimer useTimer(Duration duration, VoidCallback callback) {
  final latest = useRef(callback);
  latest.value = callback;

  final timer = useMemoized(
    () => RestartableTimer(duration, () => latest.value()),
    [duration],
  );

  useEffect(() => timer.cancel, [timer]);

  return timer;
}
