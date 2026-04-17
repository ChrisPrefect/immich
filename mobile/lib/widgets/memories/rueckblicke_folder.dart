import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';

/// Virtual "Rückblicke" (memories) folder entry surfaced at the top of the
/// albums list. Tapping opens a bottom sheet listing each on-this-day memory;
/// selecting one launches the normal memory viewer. Controlled by
/// [StoreKey.showMemoriesFolder].
class RueckblickeFolder extends ConsumerWidget {
  const RueckblickeFolder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!Store.get(StoreKey.showMemoriesFolder, true)) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }
    final memoriesAsync = ref.watch(driftMemoryFutureProvider);
    final memories = memoriesAsync.valueOrNull ?? const <DriftMemory>[];
    if (memories.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _openSheet(context, memories),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: context.primaryColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.auto_awesome_rounded, color: context.primaryColor, size: 28),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'memories_folder_title'.t(context: context),
                        style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'memories_folder_subtitle'.t(
                          context: context,
                          args: {'count': memories.length.toString()},
                        ),
                        style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openSheet(BuildContext context, List<DriftMemory> memories) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        minChildSize: 0.4,
        expand: false,
        builder: (sheetCtx, controller) => ListView.builder(
          controller: controller,
          itemCount: memories.length,
          itemBuilder: (_, i) {
            final memory = memories[i];
            final firstAsset = memory.assets.isNotEmpty ? memory.assets.first : null;
            return ListTile(
              leading: firstAsset != null
                  ? SizedBox(
                      width: 48,
                      height: 48,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Thumbnail.fromAsset(asset: firstAsset),
                      ),
                    )
                  : const Icon(Icons.auto_awesome_outlined),
              title: Text(_titleFor(memory)),
              subtitle: Text(
                'memories_folder_asset_count'.t(
                  context: ctx,
                  args: {'count': memory.assets.length.toString()},
                ),
              ),
              onTap: () {
                Navigator.of(ctx).pop();
                ctx.router.push(DriftMemoryRoute(memories: memories, memoryIndex: i));
              },
            );
          },
        ),
      ),
    );
  }

  String _titleFor(DriftMemory memory) {
    final yearsAgo = DateTime.now().year - memory.data.year;
    if (yearsAgo <= 0) {
      return 'memories_folder_this_year'.tr();
    }
    return 'memories_folder_years_ago'.tr(namedArgs: {'years': yearsAgo.toString()});
  }
}
