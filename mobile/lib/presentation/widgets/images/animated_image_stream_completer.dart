import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show InformationCollector;
import 'package:flutter/painting.dart';

/// A [MultiFrameImageStreamCompleter] with support for listener tracking
/// which makes resource cleanup possible when no longer needed.
/// Codec is disposed through the MultiFrameImageStreamCompleter's internals onDispose method
class AnimatedImageStreamCompleter extends MultiFrameImageStreamCompleter {
  void Function()? _onLastListenerRemoved;
  ImageStreamListener? _cacheListener;

  AnimatedImageStreamCompleter._({
    required super.codec,
    required super.scale,
    super.informationCollector,
    void Function()? onLastListenerRemoved,
  }) : _onLastListenerRemoved = onLastListenerRemoved;

  factory AnimatedImageStreamCompleter({
    required Stream<Object> stream,
    required double scale,
    ImageInfo? initialImage,
    InformationCollector? informationCollector,
    void Function()? onLastListenerRemoved,
  }) {
    final codecCompleter = Completer<ui.Codec>();
    final self = AnimatedImageStreamCompleter._(
      codec: codecCompleter.future,
      scale: scale,
      informationCollector: informationCollector,
      onLastListenerRemoved: onLastListenerRemoved,
    );

    if (initialImage != null) {
      self.setImage(initialImage);
    }

    stream.listen(
      (item) {
        if (item is ImageInfo) {
          self.setImage(item);
        } else if (item is ui.Codec) {
          if (!codecCompleter.isCompleted) {
            codecCompleter.complete(item);
          }
        }
      },
      onError: (Object error, StackTrace stack) {
        if (!codecCompleter.isCompleted) {
          codecCompleter.completeError(error, stack);
        }
      },
      onDone: () {
        if (!codecCompleter.isCompleted) {
          codecCompleter.completeError(StateError('Stream closed without providing a codec'));
        }
      },
    );

    return self;
  }

  @override
  void addListener(ImageStreamListener listener) {
    _cacheListener ??= listener;
    super.addListener(listener);
  }

  @override
  void removeListener(ImageStreamListener listener) {
    super.removeListener(listener);
    if (listener != _cacheListener) {
      _cancel();
    }
  }

  void _cancel() {
    _onLastListenerRemoved?.call();
    _onLastListenerRemoved = null;
  }
}
