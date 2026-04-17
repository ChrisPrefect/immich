import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

/// Dialog that allows the user to change the active server URL without
/// triggering a logout. The access token is preserved across the switch; if the
/// new URL points to a different server the next request will simply fail 401
/// and the normal auth flow will re-engage.
class ChangeServerUrlDialog extends HookConsumerWidget {
  const ChangeServerUrlDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = getServerUrl() ?? '';
    final controller = useTextEditingController(text: current);
    final isLoading = useState(false);
    final errorText = useState<String?>(null);

    Future<void> submit() async {
      final newUrl = controller.text.trim();
      if (newUrl.isEmpty) {
        errorText.value = 'login_form_err_invalid_url'.tr();
        return;
      }
      if (newUrl == current) {
        Navigator.of(context).pop();
        return;
      }

      isLoading.value = true;
      errorText.value = null;

      try {
        await ref.read(authProvider.notifier).validateServerUrl(newUrl);
        if (!context.mounted) return;
        Navigator.of(context).pop();
        ImmichToast.show(
          context: context,
          msg: 'change_server_url_success'.t(context: context),
          toastType: ToastType.success,
          gravity: ToastGravity.BOTTOM,
        );
      } catch (e) {
        errorText.value = 'change_server_url_error'.t(context: context);
      } finally {
        isLoading.value = false;
      }
    }

    return AlertDialog(
      title: Text('change_server_url_title'.t(context: context)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'change_server_url_subtitle'.t(context: context),
            style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: controller,
            autocorrect: false,
            enableSuggestions: false,
            keyboardType: TextInputType.url,
            textInputAction: TextInputAction.done,
            autofocus: true,
            decoration: InputDecoration(
              labelText: 'server_endpoint'.t(context: context),
              hintText: 'login_form_endpoint_hint'.tr(),
              border: const OutlineInputBorder(),
              errorText: errorText.value,
            ),
            onSubmitted: (_) => submit(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: isLoading.value ? null : () => Navigator.of(context).pop(),
          child: Text('cancel'.t(context: context)),
        ),
        FilledButton(
          onPressed: isLoading.value ? null : submit,
          child: isLoading.value
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : Text('save'.t(context: context)),
        ),
      ],
    );
  }
}
