import Flutter
import Photos

/// Exposes iOS' Hidden smart album to Dart so ImmichPlus can:
/// 1. auto-select the real Hidden album for backup, and
/// 2. move matching uploaded assets into Immich's Locked Folder.
///
/// Apple only returns assets here while the system Hidden-album protection is
/// disabled. If protection stays on, the album remains readable as metadata but
/// asset fetches come back empty.
class HiddenAlbumPlugin {
  static let channelName = "app.immichplus/hidden_album"

  private static let workQueue = DispatchQueue(label: "app.immichplus.hidden_album", qos: .utility)

  static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(name: channelName, binaryMessenger: registrar.messenger())
    channel.setMethodCallHandler { call, result in
      HiddenAlbumPlugin.workQueue.async {
        let value: Any?
        switch call.method {
        case "getHiddenAlbumId":
          value = HiddenAlbumPlugin.hiddenAlbum()?.localIdentifier
        case "getHiddenAssetIds":
          value = HiddenAlbumPlugin.hiddenAssetIds()
        default:
          DispatchQueue.main.async { result(FlutterMethodNotImplemented) }
          return
        }

        DispatchQueue.main.async {
          result(value)
        }
      }
    }
  }

  private static func hiddenAlbum() -> PHAssetCollection? {
    guard photoLibraryAuthorized() else {
      return nil
    }

    let collections = PHAssetCollection.fetchAssetCollections(
      with: .smartAlbum,
      subtype: .smartAlbumAllHidden,
      options: nil
    )

    return collections.firstObject
  }

  private static func hiddenAssetIds() -> [String] {
    guard let album = hiddenAlbum() else {
      return []
    }

    let options = PHFetchOptions()
    options.includeHiddenAssets = true

    let assets = PHAsset.fetchAssets(in: album, options: options)
    var ids: [String] = []
    ids.reserveCapacity(assets.count)
    assets.enumerateObjects { asset, _, _ in
      ids.append(asset.localIdentifier)
    }
    return ids
  }

  private static func photoLibraryAuthorized() -> Bool {
    let status: PHAuthorizationStatus
    if #available(iOS 14, *) {
      status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    } else {
      status = PHPhotoLibrary.authorizationStatus()
    }
    return status == .authorized
  }
}
