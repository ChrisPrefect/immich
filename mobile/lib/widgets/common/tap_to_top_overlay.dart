import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_notifier.provider.dart';

/// Transparent overlay pinned to the top safe-area (status bar region).
/// Tapping it first scrolls the active [PrimaryScrollController] to the top,
/// then emits the project-specific scroll-to-top signals used by custom
/// timeline/grid implementations.
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
              final controller = PrimaryScrollController.maybeOf(context);
              if (controller != null && controller.hasClients) {
                controller.animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeOutCubic);
              }
              scrollToTopNotifierProvider.scrollToTop();
              EventStream.shared.emit(const ScrollToTopEvent());
            },
          ),
        ),
      ],
    );
  }
}
