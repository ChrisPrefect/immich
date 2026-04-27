import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/response_extensions.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

final shareServiceProvider = Provider((ref) => ShareService(ref.watch(apiServiceProvider)));

class ShareService {
  final ApiService _apiService;
  final Logger _log = Logger("ShareService");

  ShareService(this._apiService);

  Future<bool> shareAsset(Asset asset, BuildContext context) async {
    return await shareAssets([asset], context);
  }

  Future<void> _cleanupTempFiles(List<File> tempFiles) async {
    await Future.wait(
      tempFiles.map((file) async {
        try {
          await file.delete();
        } catch (error) {
          _log.warning("Failed to delete temporary share file: ${file.path}", error);
        }
      }),
    );
  }

  Future<bool> shareAssets(List<Asset> assets, BuildContext context) async {
    final tempFiles = <File>[];

    try {
      final downloadedXFiles = <XFile>[];

      for (var asset in assets) {
        if (asset.isLocal) {
          // Prefer local assets to share
          File? f = await asset.local!.originFile;
          downloadedXFiles.add(XFile(f!.path));
          if (Platform.isIOS) {
            tempFiles.add(f);
          }
        } else if (asset.isRemote) {
          // Download remote asset otherwise
          final tempDir = await getTemporaryDirectory();
          final fileName = asset.fileName;
          final tempFile = await File('${tempDir.path}/$fileName').create();
          tempFiles.add(tempFile);
          final res = await _apiService.assetsApi.downloadAssetWithHttpInfo(asset.remoteId!);

          if (res.statusCode != 200) {
            _log.severe("Asset download for ${asset.fileName} failed", res.toLoggerString());
            continue;
          }

          tempFile.writeAsBytesSync(res.bodyBytes);
          downloadedXFiles.add(XFile(tempFile.path));
        }
      }

      if (downloadedXFiles.isEmpty) {
        _log.warning("No asset can be retrieved for share");
        unawaited(_cleanupTempFiles(tempFiles));
        return false;
      }

      if (downloadedXFiles.length != assets.length) {
        _log.warning("Partial share - Requested: ${assets.length}, Sharing: ${downloadedXFiles.length}");
      }

      final size = MediaQuery.of(context).size;
      unawaited(
        Share.shareXFiles(
          downloadedXFiles,
          sharePositionOrigin: Rect.fromPoints(Offset.zero, Offset(size.width / 3, size.height)),
        ).whenComplete(() => _cleanupTempFiles(tempFiles)),
      );
      return true;
    } catch (error) {
      unawaited(_cleanupTempFiles(tempFiles));
      _log.severe("Share failed", error);
    }
    return false;
  }
}
