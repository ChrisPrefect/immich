import Flutter
import Photos
import UIKit

/// ImmichPlus: exposes iOS' hidden smart album to Dart via a MethodChannel so
/// the Hidden → Locked Folder sync can list assets that Apple otherwise hides
/// from the regular PHFetchOptions pipeline. The matching
/// `NSPhotoLibraryIncludeHiddenUsageDescription` entitlement is in Info.plist.
///
/// Channel: `app.immichplus/hidden_album`
/// Method:  `getHiddenAssetIds` → [String]  (PHAsset.localIdentifier of every
///           asset in `.smartAlbumUserLibrary ∪ .smartAlbumHidden` that is
///           marked hidden)
class HiddenAlbumPlugin {
  static let channelName = "app.immichplus/hidden_album"

  static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(name: channelName, binaryMessenger: registrar.messenger())
    channel.setMethodCallHandler { call, result in
      switch call.method {
      case "getHiddenAssetIds":
        result(HiddenAlbumPlugin.hiddenAssetIds())
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  /// Returns the localIdentifier of every PHAsset in the user's hidden smart
  /// album. Requires photo-library authorization + the hidden-usage
  /// description in Info.plist. On older iOS versions or if permission is
  /// missing, returns an empty list.
  static func hiddenAssetIds() -> [String] {
    let status: PHAuthorizationStatus
    if #available(iOS 14, *) {
      status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    } else {
      status = PHPhotoLibrary.authorizationStatus()
    }
    guard status == .authorized else { return [] }

    let albums = PHAssetCollection.fetchAssetCollections(
      with: .smartAlbum,
      subtype: .smartAlbumUserLibrary,
      options: nil
    )
    // Combine all hidden smart albums (user library + system hidden) to be
    // robust against iOS version differences.
    let hiddenAlbums = PHAssetCollection.fetchAssetCollections(
      with: .smartAlbum,
      subtype: .any,
      options: nil
    )

    var ids: [String] = []
    let options = PHFetchOptions()
    options.includeHiddenAssets = true

    // Apple documents `PHAssetCollectionSubtype.smartAlbumHidden` with rawValue
    // 205 on all supported iOS versions. Use the raw value for forward-
    // compatibility with SDK versions where the symbolic case is missing.
    let hiddenSubtypeRaw = 205
    hiddenAlbums.enumerateObjects { collection, _, _ in
      guard collection.assetCollectionSubtype.rawValue == hiddenSubtypeRaw else { return }
      let assets = PHAsset.fetchAssets(in: collection, options: options)
      assets.enumerateObjects { asset, _, _ in
        ids.append(asset.localIdentifier)
      }
    }

    // Fallback: scan user library for assets with isHidden = true (some iOS
    // versions don't expose the smart album).
    if ids.isEmpty {
      albums.enumerateObjects { collection, _, _ in
        let all = PHAsset.fetchAssets(in: collection, options: options)
        all.enumerateObjects { asset, _, _ in
          if asset.isHidden {
            ids.append(asset.localIdentifier)
          }
        }
      }
    }

    return ids
  }
}
