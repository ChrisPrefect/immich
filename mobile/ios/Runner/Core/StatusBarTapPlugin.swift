import Flutter
import UIKit

final class StatusBarTapPlugin: NSObject, UIScrollViewDelegate {
  static let name = "ImmichPlusStatusBarTapPlugin"
  static let channelName = "app.immichplus/status_bar_tap"

  private static var instance: StatusBarTapPlugin?

  private let channel: FlutterMethodChannel
  private weak var rootView: UIView?
  private let tapScrollView = UIScrollView(frame: CGRect(x: 0, y: 0, width: 1, height: 1))

  static func register(with registrar: FlutterPluginRegistrar, rootView: UIView) {
    let plugin = StatusBarTapPlugin(messenger: registrar.messenger(), rootView: rootView)
    instance = plugin
    plugin.install()
  }

  private init(messenger: FlutterBinaryMessenger, rootView: UIView) {
    self.channel = FlutterMethodChannel(name: Self.channelName, binaryMessenger: messenger)
    self.rootView = rootView
    super.init()

    channel.setMethodCallHandler { [weak self] call, result in
      guard call.method == "install" else {
        result(FlutterMethodNotImplemented)
        return
      }

      self?.install()
      result(nil)
    }
  }

  private func install() {
    DispatchQueue.main.async { [weak self] in
      guard let self, let rootView = self.rootView else { return }
      if self.tapScrollView.superview !== rootView {
        self.tapScrollView.removeFromSuperview()
        rootView.insertSubview(self.tapScrollView, at: 0)
      }

      self.tapScrollView.delegate = self
      self.tapScrollView.scrollsToTop = true
      self.tapScrollView.showsVerticalScrollIndicator = false
      self.tapScrollView.showsHorizontalScrollIndicator = false
      self.tapScrollView.backgroundColor = .clear
      self.tapScrollView.alpha = 0.01
      self.tapScrollView.contentSize = CGSize(width: 1, height: 2)
      self.tapScrollView.contentOffset = CGPoint(x: 0, y: 1)
    }
  }

  func scrollViewShouldScrollToTop(_ scrollView: UIScrollView) -> Bool {
    channel.invokeMethod("onTap", arguments: nil)
    scrollView.contentOffset = CGPoint(x: 0, y: 1)
    return false
  }
}
