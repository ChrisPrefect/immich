import 'dart:io';

import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_notifier.provider.dart';

class StatusBarTapService {
  static const _channel = MethodChannel('app.immichplus/status_bar_tap');
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized || !Platform.isIOS) {
      return;
    }

    _initialized = true;
    _channel.setMethodCallHandler((call) async {
      if (call.method != 'onTap') {
        throw MissingPluginException('Unknown status bar tap method ${call.method}');
      }

      scrollToTopNotifierProvider.scrollToTop();
      EventStream.shared.emit(const ScrollToTopEvent());
    });

    await _channel.invokeMethod<void>('install');
  }
}
