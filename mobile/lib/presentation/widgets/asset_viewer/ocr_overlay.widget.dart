import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/ocr.provider.dart';

class OcrOverlay extends ConsumerStatefulWidget {
  final BaseAsset asset;
  final Size imageSize;
  final Size viewportSize;

  const OcrOverlay({super.key, required this.asset, required this.imageSize, required this.viewportSize});

  @override
  ConsumerState<OcrOverlay> createState() => _OcrOverlayState();
}

class _OcrOverlayState extends ConsumerState<OcrOverlay> {
  int? _selectedBoxIndex;

  @override
  Widget build(BuildContext context) {
    if (widget.asset is! RemoteAsset) {
      return const SizedBox.shrink();
    }

    final ocrData = ref.watch(driftOcrAssetProvider((widget.asset as RemoteAsset).id));

    return ocrData.when(
      data: (data) {
        if (data == null || data.isEmpty) {
          return const SizedBox.shrink();
        }

        return _buildOcrBoxes(data);
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildOcrBoxes(List<DriftOcr> ocrData) {
    // Calculate the scale factor to fit the image in the viewport
    final imageWidth = widget.imageSize.width;
    final imageHeight = widget.imageSize.height;
    final viewportWidth = widget.viewportSize.width;
    final viewportHeight = widget.viewportSize.height;

    // Calculate how the image is scaled to fit in the viewport
    final scaleX = viewportWidth / imageWidth;
    final scaleY = viewportHeight / imageHeight;
    final scale = scaleX < scaleY ? scaleX : scaleY;

    // Calculate the actual displayed image size
    final displayedWidth = imageWidth * scale;
    final displayedHeight = imageHeight * scale;

    // Calculate the offset to center the image
    final offsetX = (viewportWidth - displayedWidth) / 2;
    final offsetY = (viewportHeight - displayedHeight) / 2;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        setState(() {
          _selectedBoxIndex = null;
        });
      },
      child: Stack(
        children: [
          // Invisible layer to catch taps outside of boxes
          SizedBox(width: viewportWidth, height: viewportHeight),
          ...ocrData.asMap().entries.map((entry) {
            final index = entry.key;
            final ocr = entry.value;
            final isSelected = _selectedBoxIndex == index;

            // Normalize coordinates (0-1 range) and scale to displayed image size
            final x1 = ocr.x1 * displayedWidth + offsetX;
            final y1 = ocr.y1 * displayedHeight + offsetY;
            final x2 = ocr.x2 * displayedWidth + offsetX;
            final y2 = ocr.y2 * displayedHeight + offsetY;
            final x3 = ocr.x3 * displayedWidth + offsetX;
            final y3 = ocr.y3 * displayedHeight + offsetY;
            final x4 = ocr.x4 * displayedWidth + offsetX;
            final y4 = ocr.y4 * displayedHeight + offsetY;

            // Calculate bounding rectangle for hit testing
            final minX = [x1, x2, x3, x4].reduce((a, b) => a < b ? a : b);
            final maxX = [x1, x2, x3, x4].reduce((a, b) => a > b ? a : b);
            final minY = [y1, y2, y3, y4].reduce((a, b) => a < b ? a : b);
            final maxY = [y1, y2, y3, y4].reduce((a, b) => a > b ? a : b);

            // Calculate rotation angle from the bottom edge (x1,y1) to (x2,y2)
            final angle = math.atan2(y2 - y1, x2 - x1);
            final centerX = (minX + maxX) / 2;
            final centerY = (minY + maxY) / 2;

            return Positioned(
              left: minX,
              top: minY,
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedBoxIndex = isSelected ? null : index;
                  });
                },
                behavior: HitTestBehavior.translucent,
                child: SizedBox(
                  width: maxX - minX,
                  height: maxY - minY,
                  child: Stack(
                    children: [
                      CustomPaint(
                        painter: _OcrBoxPainter(
                          points: [
                            Offset(x1 - minX, y1 - minY),
                            Offset(x2 - minX, y2 - minY),
                            Offset(x3 - minX, y3 - minY),
                            Offset(x4 - minX, y4 - minY),
                          ],
                          isSelected: isSelected,
                          context: context,
                        ),
                        size: Size(maxX - minX, maxY - minY),
                      ),
                      if (isSelected)
                        Positioned(
                          left: centerX - minX,
                          top: centerY - minY,
                          child: FractionalTranslation(
                            translation: const Offset(-0.5, -0.5),
                            child: Transform.rotate(
                              angle: angle,
                              alignment: Alignment.center,
                              child: Container(
                                margin: const EdgeInsets.all(2),
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.grey[800]?.withValues(alpha: 0.4),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: ConstrainedBox(
                                  constraints: BoxConstraints(
                                    maxWidth: math.max(50, maxX - minX),
                                    maxHeight: math.max(20, maxY - minY),
                                  ),
                                  child: FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: SelectableText(
                                      ocr.text,
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: math.max(12, (maxY - minY) * 0.6),
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _OcrBoxPainter extends CustomPainter {
  final List<Offset> points;
  final bool isSelected;
  final BuildContext context;

  _OcrBoxPainter({required this.points, required this.isSelected, required this.context});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isSelected ? context.primaryColor : Colors.green
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final fillPaint = Paint()
      ..color = (isSelected ? context.primaryColor : Colors.green).withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(points[0].dx, points[0].dy)
      ..lineTo(points[1].dx, points[1].dy)
      ..lineTo(points[2].dx, points[2].dy)
      ..lineTo(points[3].dx, points[3].dy)
      ..close();

    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_OcrBoxPainter oldDelegate) {
    return oldDelegate.isSelected != isSelected || oldDelegate.points != points;
  }
}
