import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_notifier.provider.dart';

/// Transparent overlay pinned to the top safe-area (status bar region).
/// Tapping it fires both `scrollToTopNotifierProvider` and [ScrollToTapEvent]
/// so scrollables in the active tab scroll to their start. Mirrors iOS
/// "tap status bar to scroll to top" behavior which Flutter does not implement
/// natively because its scroll views are not backed by UIScrollView.
class TapToTopOverlay extends StatelessWidget {
  final Widget child;

  const TapToTopOverlay({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    return Stack(
      children: [
        child,
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: topInset > 0 ? topInset : 20,
          child: GestureDetector(
            behavior: HitTestBehavior.translucent,
            onTap: () {
              scrollToTopNotifierProvider.scrollToTop();
              EventStream.shared.emit(const ScrollToTopEvent());
            },
          ),
        ),
      ],
    );
  }
}
