# Immich iOS App - Custom Changes (Immich+)

Alle Änderungen basieren auf einem einzelnen Commit (`c50fd867a`) auf Branch `main`.
Basis-Version: Immich v2.6.0 (Commit `e6c5fbd10`).

---

## 1. Bundle Identifier Umbenennung (Rebranding)

Alle Bundle Identifiers wurden von `app.alextran.immich` zu `app.immichplus` geändert.

### Dateien und exakte Änderungen:

#### `mobile/ios/Runner.xcodeproj/project.pbxproj`
- `PRODUCT_BUNDLE_IDENTIFIER`: 
  - `app.alextran.immich.profile` → `app.immichplus.profile` (Profile config)
  - `app.alextran.immich.vdebug` → `app.immichplus.vdebug` (Debug config)
  - `app.alextran.immich` → `app.immichplus` (Release config)
  - `app.alextran.immich.vdebug.Widget` → `app.immichplus.vdebug.Widget`
  - `app.alextran.immich.Widget` → `app.immichplus.Widget`
  - `app.alextran.immich.profile.Widget` → `app.immichplus.profile.Widget`
  - `app.alextran.immich.vdebug.ShareExtension` → `app.immichplus.vdebug.ShareExtension`
  - `app.alextran.immich.ShareExtension` → `app.immichplus.ShareExtension`
  - `app.alextran.immich.profile.ShareExtension` → `app.immichplus.profile.ShareExtension`
- `CUSTOM_GROUP_ID`: `group.app.immich.share` → `group.app.immichplus.share` (alle Configs)
- `DEVELOPMENT_TEAM`: `2F67MQ8R79` → `L95F4M2LHG` (Debug/Release), `""` (Profile)
- `objectVersion`: `54` → `77`
- Leere `exceptions` Blöcke aus PBXFileSystemSynchronizedRootGroup entfernt (Core, Sync, Schemas)
- Leere `inputPaths`/`outputPaths` Arrays zu Copy Pods Resources und Embed Pods Frameworks hinzugefügt

#### `mobile/ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme`
- LaunchAction `buildConfiguration`: `Debug` → `Release`

#### `mobile/ios/Runner/Info.plist`
- BGTaskSchedulerPermittedIdentifiers:
  - `app.alextran.immich.background.refreshUpload` → `app.immichplus.background.refreshUpload`
  - `app.alextran.immich.background.processingUpload` → `app.immichplus.background.processingUpload`
  - `app.alextran.immich.backgroundFetch` → `app.immichplus.backgroundFetch`
  - `app.alextran.immich.backgroundProcessing` → `app.immichplus.backgroundProcessing`

#### `mobile/ios/Runner/Runner.entitlements`
- App Group: `group.app.immich.share` → `group.app.immichplus.share`

#### `mobile/ios/Runner/RunnerProfile.entitlements`
- App Group: `group.app.immich.share` → `group.app.immichplus.share`

#### `mobile/ios/ShareExtension/ShareExtension.entitlements`
- App Group: `group.app.immich.share` → `group.app.immichplus.share`

#### `mobile/ios/WidgetExtension/WidgetExtension.entitlements`
- App Group: `group.app.immich.share` → `group.app.immichplus.share`

#### `mobile/ios/WidgetExtension/ImmichAPI.swift`
- `IMMICH_SHARE_GROUP`: `"group.app.immich.share"` → `"group.app.immichplus.share"`

#### `mobile/ios/Runner/Core/URLSessionManager.swift`
- `CLIENT_CERT_LABEL`: `"app.alextran.immich.client_identity"` → `"app.immichplus.client_identity"`

#### `mobile/ios/Runner/Background/BackgroundWorker.swift`
- Alle `app.alextran.immich.background.*` Identifier in Kommentaren → `app.immichplus.background.*`

#### `mobile/ios/Runner/Background/BackgroundWorkerApiImpl.swift`
- `refreshTaskID`: `"app.alextran.immich.background.refreshUpload"` → `"app.immichplus.background.refreshUpload"`
- `processingTaskID`: `"app.alextran.immich.background.processingUpload"` → `"app.immichplus.background.processingUpload"`

#### `mobile/ios/Runner/BackgroundSync/BackgroundServicePlugin.swift`
- `backgroundFetchTaskID`: `"app.alextran.immich.backgroundFetch"` → `"app.immichplus.backgroundFetch"`
- `backgroundProcessingTaskID`: `"app.alextran.immich.backgroundProcessing"` → `"app.immichplus.backgroundProcessing"`
- Kommentare: alle `app.alextran.immich.*` → `app.immichplus.*`

#### `mobile/ios/fastlane/Appfile`
- `app_identifier`: `"app.alextran.immich"` → `"app.immichplus"`
- `apple_id`: `"alex.tran1502@gmail.com"` auskommentiert → `# apple_id "YOUR_APPLE_ID@example.com"`

#### `mobile/ios/fastlane/Fastfile`
- `TEAM_ID`: `"2F67MQ8R79"` → `""` (mit Kommentar "Set your Apple Developer Team ID here")
- `CODE_SIGN_IDENTITY`: `"Apple Distribution: Hau Tran (#{TEAM_ID})"` → `"Apple Development"`
- `BASE_BUNDLE_ID`: `"app.alextran.immich"` → `"app.immichplus"`

#### `mobile/lib/constants/constants.dart`
- `appShareGroupId`: `"group.app.immich.share"` → `"group.app.immichplus.share"`
- Android Widget Receiver FQDNs:
  - `'app.alextran.immich.widget.RandomReceiver'` → `'app.immichplus.widget.RandomReceiver'`
  - `'app.alextran.immich.widget.MemoryReceiver'` → `'app.immichplus.widget.MemoryReceiver'`

---

## 2. Neue App-Einstellung: "Gruppierung: Keine" (GroupAssetsBy.none)

Ermöglicht es, Assets in Alben, auf der Karte und in der Haupttimeline OHNE Datumsgruppierung anzuzeigen (alle Assets als eine einzige flache Liste).

### Dateien:

#### `mobile/lib/widgets/settings/asset_list_settings/asset_list_group_settings.dart`
- Neues `SettingsRadioGroup` Widget hinzugefügt für `GroupAssetsBy.none` mit Text `'asset_list_layout_settings_group_by_none'`
- `ref.invalidate(settingsProvider)` nach Einstellungsänderung hinzugefügt (Import `setting.provider.dart`)

#### `mobile/lib/infrastructure/repositories/timeline.repository.dart`
3 Methoden geändert, die vorher bei `GroupAssetsBy.none` eine `UnsupportedError` warfen:

**`_watchMainBucket` (ca. Zeile 58)**:
- Statt `throw UnsupportedError(...)`:
- Query mit `GroupAssetsBy.day` ausführen, aber alle Rows zu einem einzigen Count zusammenfalten:
  ```dart
  return _db.mergedAssetDrift
      .mergedBucket(userIds: userIds, groupBy: GroupAssetsBy.day.index)
      .watch()
      .map((rows) => _generateBuckets(rows.fold<int>(0, (sum, row) => sum + row.assetCount)));
  ```

**`_watchPlaceBucket` (ca. Zeile 361)**:
- Statt `throw UnsupportedError(...)`:
- Eigene Count-Query über `remoteAssetEntity` mit Join auf `remoteExifEntity`:
  ```dart
  final countExp = _db.remoteAssetEntity.id.count();
  final query = _db.remoteAssetEntity.selectOnly()
    ..addColumns([countExp])
    ..join([
      innerJoin(
        _db.remoteExifEntity,
        _db.remoteExifEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
        useColumns: false,
      ),
    ])
    ..where(
      _db.remoteExifEntity.city.equals(place) &
          _db.remoteAssetEntity.deletedAt.isNull() &
          _db.remoteAssetEntity.visibility.equalsValue(AssetVisibility.timeline),
    );
  return query.map((row) => _generateBuckets(row.read(countExp)!)).watchSingle();
  ```

**`_watchMapBucket` (ca. Zeile 515)**:
- Statt `throw UnsupportedError(...)`:
- Eigene Count-Query über `remoteAssetEntity` mit Join auf `remoteExifEntity` inkl. Bounds-Filter:
  ```dart
  final countExp = _db.remoteAssetEntity.id.count();
  final query = _db.remoteAssetEntity.selectOnly()
    ..addColumns([countExp])
    ..join([
      innerJoin(
        _db.remoteExifEntity,
        _db.remoteExifEntity.assetId.equalsExp(_db.remoteAssetEntity.id),
        useColumns: false,
      ),
    ])
    ..where(
      _db.remoteAssetEntity.ownerId.isIn(userId) &
          _db.remoteExifEntity.inBounds(options.bounds) &
          _db.remoteAssetEntity.visibility.isIn([
            AssetVisibility.timeline.index,
            if (options.includeArchived) AssetVisibility.archive.index,
          ]) &
          _db.remoteAssetEntity.deletedAt.isNull(),
    );
  if (options.onlyFavorites) {
    query.where(_db.remoteAssetEntity.isFavorite.equals(true));
  }
  if (options.relativeDays != 0) {
    final cutoffDate = DateTime.now().toUtc().subtract(Duration(days: options.relativeDays));
    query.where(_db.remoteAssetEntity.createdAt.isBiggerOrEqualValue(cutoffDate));
  }
  return query.map((row) => _generateBuckets(row.read(countExp)!)).watchSingle();
  ```

---

## 3. Neue App-Einstellung: "Titelbild ausblenden" (hideHeaderImage)

Erlaubt es, das große animierte Header-Bild in Album-, Personen- und Orts-Ansichten zu deaktivieren. Stattdessen wird ein einfacher `SliverAppBar` mit Titel angezeigt.

**Semantik invertiert** (ImmichPlus-Konvention: `aktiv = abweichend vom Standard`): Aktiv = Header versteckt. Default: **`true`** (= versteckt).

### Dateien:

#### `mobile/lib/domain/models/store.model.dart`
- StoreKey: `hideHeaderImage<bool>._(1014)`  *(numerische ID 1014 behält den alten `showHeaderImage`-Slot; Upgrades lesen den alten `true`-Wert als "hide=true", was dem neuen Immich+-Default entspricht.)*

#### `mobile/lib/services/app_settings.service.dart`
- Enum: `hideHeaderImage<bool>(StoreKey.hideHeaderImage, null, true)` (Default: `true` = versteckt)

#### `mobile/lib/widgets/settings/asset_list_settings/asset_list_settings.dart`
- Hook `useAppSettingsState(AppSettingsEnum.hideHeaderImage)`
- `SettingsSwitchListTile` mit Titel `'immich_plus_hide_header_image_title'` zwischen Storage Indicator und Layout Settings

#### `mobile/lib/widgets/common/mesmerizing_sliver_app_bar.dart`
- `hideHeaderImage` aus AppSettings lesen
- Wenn `hideHeaderImage`: Einfachen `SliverAppBar` rendern (pinned, centered title, back button) statt des animierten Headers. Bei MultiSelect: `SliverToBoxAdapter` mit `SizedBox(height: 120)`

#### `mobile/lib/widgets/common/person_sliver_app_bar.dart`
- `hideHeaderImage` aus AppSettings lesen
- Wenn `hideHeaderImage`: Einfachen `SliverAppBar` mit Personenname (oder `'add_a_name'`), Back-Button und More-Button rendern. Bei MultiSelect: `SliverToBoxAdapter` mit `SizedBox(height: 120)`

#### `mobile/lib/widgets/common/remote_album_sliver_app_bar.dart`
- `hideHeaderImage` aus AppSettings lesen
- Wenn `hideHeaderImage`: Einfachen `SliverAppBar` mit Albumname, Back-Button, Activity-Button (wenn shared+enabled) und Kebab-Menu. Bei MultiSelect: Back-Button ausgeblendet

---

## 4. Neue App-Einstellung: "Sync-Benachrichtigungen ausblenden" (hideSyncNotifications)

Unterdrückt alle Notifications die durch den Backup/Sync-Prozess erzeugt werden.

**Semantik invertiert** (ImmichPlus-Konvention: `aktiv = abweichend vom Standard`): Aktiv = Notifications versteckt. Default: **`true`** (= versteckt).

### Dateien:

#### `mobile/lib/domain/models/store.model.dart`
- StoreKey: `hideSyncNotifications<bool>._(1015)`  *(numerische ID 1015 behält den alten `showSyncNotifications`-Slot — alte `true`-Werte werden als "hide=true" reinterpretiert, was dem neuen Immich+-Default entspricht.)*

#### `mobile/lib/services/app_settings.service.dart`
- Enum: `hideSyncNotifications<bool>(StoreKey.hideSyncNotifications, null, true)` (Default: `true` = versteckt)

#### `mobile/lib/widgets/settings/notification_setting.dart`
- Hook `useAppSettingsState(AppSettingsEnum.hideSyncNotifications)`
- `SettingsSwitchListTile`:
  - Titel: `'immich_plus_hide_sync_notifications_title'`
  - Subtitle: `'immich_plus_hide_sync_notifications_subtitle'`
  - Zwischen Permission-Check und Total Progress Toggle

#### `mobile/lib/utils/bootstrap.dart`
- `configureFileDownloaderNotifications({bool hideSyncNotifications = false})`
- Wenn `hideSyncNotifications`: `FileDownloader().configureNotificationForGroup(...)` Aufrufe für `kManualUploadGroup` und `kBackupGroup` werden übersprungen (nur Download-Gruppe bleibt aktiv)

#### `mobile/lib/main.dart`
- In `didChangeDependencies()`: `hideSyncNotifications` aus AppSettings lesen und an `configureFileDownloaderNotifications(hideSyncNotifications: ...)` übergeben

#### `mobile/lib/domain/services/background_worker.service.dart`
- `hideSyncNotifications` aus AppSettings lesen, an `configureFileDownloaderNotifications(hideSyncNotifications: ...)` durchreichen.

#### `mobile/lib/services/background.service.dart`
- Lokale Variable `showSyncNotifications = !settingsService.getSetting(...hideSyncNotifications)` — restliche Logik (notifyTotalProgress/notifySingleProgress, Error-/Progress-Notifications) bleibt unverändert.

---

## 5. Neue Settings-Seite "ImmichPlus Anpassungen"

Eine eigene Settings-Unterseite, die alle ImmichPlus-spezifischen Toggles bündelt. Sie erscheint **ganz oben** in der Einstellungs-Liste (erster Eintrag vor "Erweitert").

### Dateien:

#### `mobile/lib/widgets/settings/immich_plus_settings/immich_plus_settings.dart` *(NEU)*
Eigener `HookConsumerWidget` als zentrale ImmichPlus-Seite.

Grundregel für **alle** ImmichPlus-Toggles:
- **Off** = Standardverhalten von upstream / vor den Fork-Änderungen
- **On** = ImmichPlus-Anpassung aktiv
- Default für neue Installationen: **On**

Die Seite bündelt die fork-spezifischen UI-/Sync-Anpassungen (z. B. `hideHeaderImage`, `hideSyncNotifications`, `reverseTimeline`, `showMemoriesFolder`, `syncIosFavorites`) plus die Album-Filter-Auswahl.

Nach jeder Änderung werden `appSettingsServiceProvider` und `settingsProvider` invalidiert, damit abhängige Views (Timeline, Notifications-Registrierung) neu aufgebaut werden.

#### `mobile/lib/pages/common/settings.page.dart`
- Import hinzugefügt: `immich_plus_settings/immich_plus_settings.dart`
- Neuer Enum-Wert **als erstes** in `SettingSection`:
  ```dart
  immichPlus('immich_plus_settings_title', Icons.auto_awesome_outlined, "immich_plus_settings_subtitle"),
  ```
- `switch`-Branch: `SettingSection.immichPlus => const ImmichPlusSettings()`
- Das Routing über `SettingsSubRoute(section: setting)` funktioniert automatisch — keine Änderung an Router-Generierung nötig.

---

## 6. Übersetzungen (i18n)

### `i18n/en.json`
Neue Keys (Basis-Batch):
```json
"asset_list_layout_settings_group_by_none": "None",
"immich_plus_disable_grouping_subtitle": "Show all assets as a single flat list without date grouping",
"immich_plus_disable_grouping_title": "Disable date grouping",
"immich_plus_hide_header_image_subtitle": "Hide the large animated header image in album, person and place views.",
"immich_plus_hide_header_image_title": "Hide header image",
"immich_plus_hide_sync_notifications_subtitle": "Suppress the background-sync start / progress / complete notifications.",
"immich_plus_hide_sync_notifications_title": "Hide sync notifications",
"immich_plus_settings_subtitle": "Customizations specific to ImmichPlus",
"immich_plus_settings_title": "ImmichPlus Customizations"
```

### `i18n/de.json`
Neue Keys (Basis-Batch):
```json
"asset_list_layout_settings_group_by_none": "Keine",
"immich_plus_disable_grouping_subtitle": "Alle Assets als flache Liste ohne Datumsgruppierung anzeigen",
"immich_plus_disable_grouping_title": "Datumsgruppierung deaktivieren",
"immich_plus_hide_header_image_subtitle": "Blendet das grosse animierte Titelbild in Alben-, Personen- und Ortsansichten aus.",
"immich_plus_hide_header_image_title": "Titelbild ausblenden",
"immich_plus_hide_sync_notifications_subtitle": "Unterdrückt Benachrichtigungen, wenn der Hintergrund-Sync startet, läuft oder fertig ist.",
"immich_plus_hide_sync_notifications_title": "Sync-Benachrichtigungen ausblenden",
"immich_plus_settings_subtitle": "Anpassungen speziell für ImmichPlus",
"immich_plus_settings_title": "ImmichPlus Anpassungen"
```

---

## 7. iOS Build-Konfiguration

#### `mobile/ios/Podfile.lock`
- Nur aktualisierte SPEC CHECKSUMS (automatisch durch `pod install` generiert) - keine manuelle Änderung nötig, wird beim Build neu erzeugt

---

## 8. Neue StoreKeys und AppSettingsEnum-Werte

Alle weiteren Immich+ Features greifen auf diese neuen StoreKeys/Settings zurück. Beim Re-Fork **zuerst** diese Schlüssel anlegen, dann die folgenden Abschnitte umsetzen.

#### `mobile/lib/domain/models/store.model.dart`
Neue Enum-Einträge im `StoreKey`-Enum (nach `hideSyncNotifications<bool>._(1015)`):
```dart
// ImmichPlus customizations
reverseTimeline<bool>._(1016),
hideAssetBadges<bool>._(1017),
hideMemoriesLane<bool>._(1018),
showMemoriesFolder<bool>._(1019),
scrollRestoreOnViewerClose<bool>._(1020),
placesDirectToMap<bool>._(1021),
// Stored as "lat,lng,zoom" string (Store only supports int/String/bool/DateTime)
lastMapCamera<String>._(1022),
syncIosFavorites<bool>._(1025),
syncIosHiddenToLockedFolder<bool>._(1026),
logsShowAssetDetail<bool>._(1027),
photosFilterAlbumIds<String>._(1028),
photosFilterMode<int>._(1029),
```
(IDs 1023/1024 wurden während der Entwicklung reserviert und später durch `lastMapCamera` ersetzt — die Lücke absichtlich belassen.)

#### `mobile/lib/domain/models/setting.model.dart`
Neue Werte im `Setting`-Enum (nach `enableBackup`):
```dart
reverseTimeline<bool>(StoreKey.reverseTimeline, true),
hideAssetBadges<bool>(StoreKey.hideAssetBadges, true),
hideMemoriesLane<bool>(StoreKey.hideMemoriesLane, true),
showMemoriesFolder<bool>(StoreKey.showMemoriesFolder, true),
scrollRestoreOnViewerClose<bool>(StoreKey.scrollRestoreOnViewerClose, true),
placesDirectToMap<bool>(StoreKey.placesDirectToMap, true),
logsShowAssetDetail<bool>(StoreKey.logsShowAssetDetail, true),
syncIosFavorites<bool>(StoreKey.syncIosFavorites, true),
syncIosHiddenToLockedFolder<bool>(StoreKey.syncIosHiddenToLockedFolder, true),
```

#### `mobile/lib/services/app_settings.service.dart`
Dieselben Einträge zusätzlich in `AppSettingsEnum` (default `true`, außer `photosFilterAlbumIds=""`, `photosFilterMode=0`).

---

## 9. Delete ohne Bestätigung

In der Vollbild-Ansicht löscht der Delete-Button Assets direkt (ohne AlertDialog). iOS' systemeigener „Löschen erlauben"-Dialog für lokale Assets bleibt bestehen (kann nicht umgangen werden).

#### `mobile/lib/presentation/widgets/asset_viewer/bottom_bar.widget.dart`
- `DeleteActionButton(source: ActionSource.viewer, showConfirmation: true)` → `DeleteActionButton(source: ActionSource.viewer)` (nutzt den Default `showConfirmation: false`).

---

## 10. Video-Zeit-Overlay ohne führende Nullen

Dauer-Anzeige auf Video-Thumbnails und im Player: „15 sek" → `0:15` statt `00:15`; „1 h 5 m" → `1:05:00` statt `01:05:00`.

#### `mobile/lib/extensions/duration_extensions.dart`
`DurationFormatExtension.format()` rewritten — Minuten werden nicht mehr gepaddet wenn unter einer Stunde; Stunden werden nicht gepaddet.

```dart
String format() {
  final seconds = inSeconds.remainder(60).toString().padLeft(2, '0');
  if (inHours == 0) {
    final minutes = inMinutes.remainder(60).toString();
    return "$minutes:$seconds";
  }
  final minutes = inMinutes.remainder(60).toString().padLeft(2, '0');
  final hours = inHours.toString();
  return "$hours:$minutes:$seconds";
}
```

Wird sowohl von Thumbnail-Grids (`thumbnail_tile.widget.dart`, `thumbnail_image.dart`) als auch vom Video-Player (`video_controls.dart`) verwendet, gleiche Formatierung überall.

---

## 11. Tap-to-top (iOS Statusbar-Tap)

Neuer transparenter Overlay im Tab-Scaffold. Ein Tap auf den Status-Bar-Bereich scrollt die aktive Timeline nach oben. Flutter implementiert das nicht nativ, weil Flutter-Scrollables keine `UIScrollView`s sind.

#### `mobile/lib/widgets/common/tap_to_top_overlay.dart` *(NEU)*
Neues StatelessWidget `TapToTopOverlay` — umschließt sein Kind mit einem `Stack`; eine `GestureDetector`-Box mit Höhe `MediaQuery.padding.top` (oder 20 px Fallback) feuert bei Tap `scrollToTopNotifierProvider.scrollToTop()` und `EventStream.shared.emit(const ScrollToTopEvent())`.

#### `mobile/lib/pages/common/tab_shell.page.dart`
- Import `tap_to_top_overlay.dart`.
- Scaffold `body`: `TapToTopOverlay(child: ...)` statt direkt `child`.

#### `mobile/lib/pages/common/tab_controller.page.dart`
- Gleiche Änderung wie oben (der Legacy-Tab-Scaffold, bleibt als Backup-Route erhalten).

---

## 12. Server-URL ohne Logout ändern

In den Netzwerk-Einstellungen: Stift-Icon hinter der aktuellen Server-URL öffnet einen Dialog. Neue URL → validiert/resolved → via `authProvider.validateServerUrl(url)` gesetzt und im Store persistiert. Access-Token bleibt erhalten.

#### `mobile/lib/widgets/settings/networking_settings/change_server_url_dialog.dart` *(NEU)*
`HookConsumerWidget` mit `AlertDialog`, `TextField` (prefilled mit aktueller URL), Loading-State, Toast auf Erfolg.

#### `mobile/lib/widgets/settings/networking_settings/networking_settings.dart`
- Import `change_server_url_dialog.dart`.
- Am `ListTile` der "current_server_address"-Card ein `trailing: IconButton` mit `Icons.edit_outlined`, das den Dialog öffnet.

#### i18n-Keys
`change_server_url_title`, `change_server_url_subtitle`, `change_server_url_success`, `change_server_url_error` (EN + DE).

---

## 13. Reverse-Sort (neueste Fotos unten rechts) + Auto-Scroll-to-bottom

Einstellung `reverseTimeline`. Wenn aktiv, werden Buckets und Assets **in allen Timeline-Ansichten** umgekehrt dargestellt (ältester oben links → neuester unten rechts) und die Ansicht öffnet immer direkt ganz unten beim neuesten Asset — wie in der iOS Photos App.

#### `mobile/lib/domain/services/timeline.service.dart`
- `_wrapReversibleTimeline(TimelineQuery base)` Helper:
  - cached `totalAssets` wird aus dem `bucketSource`-Stream gelesen.
  - `bucketSource()` → Liste rückwärts (nur wenn Setting aktiv).
  - `assetSource(offset, count)` → `translatedOffset = max(0, total - offset - count)`, Ergebnis rückwärts.
  - Liest die Setting **pro Aufruf**, nicht beim Konstruieren, damit ein Toggle der Einstellung sofort greift.
- **Jede** Factory-Methode wickelt ihr `TimelineQuery` mit `_wrapReversibleTimeline(...)` ein:
  `main`, `localAlbum`, `remoteAlbum`, `remoteAssets`, `favorite`, `trash`, `archive`, `lockedFolder`, `video`, `image`, `place`, `person`, `fromAssets`, `fromAssetStream`, `fromAssetsWithBuckets`, `map`.
- Import `dart:math as math` bereits vorhanden.

#### `mobile/lib/domain/models/events.model.dart`
Neues Event:
```dart
class ScrollToBottomEvent extends Event {
  const ScrollToBottomEvent();
}
```

#### `mobile/lib/presentation/widgets/timeline/timeline.widget.dart`
- Neues Feld `_pendingScrollToBottom` in `_SliverTimelineState`.
- In `initState()`: `_pendingScrollToBottom = ref.read(settingsProvider).get(Setting.reverseTimeline);`
  → fresher Mount einer Timeline (App-Start, Album öffnen, Archiv, Locked Folder, Place, Person, …) landet beim neuesten Asset.
- Neue Methode `_maybeScrollToBottom()` — via `addPostFrameCallback` auf `maxScrollExtent` springen, Flag erst löschen wenn `max > 0`. Falls Layout noch nicht bereit, retried der nächste `TimelineReloadEvent`.
- In `_onEvent`:
  - `ScrollToBottomEvent` → `_pendingScrollToBottom = true; _maybeScrollToBottom();`
  - `TimelineReloadEvent` → vor `setState()` ein `if (_pendingScrollToBottom) _maybeScrollToBottom();`

#### `mobile/lib/presentation/pages/dev/main_timeline.page.dart`
- Imports: `events.model.dart`, `event_stream.dart`.
- Im Body `ref.listen(photosFilterProvider, …)` vor dem Rest: bei Filter-Wechsel und aktivem `reverseTimeline` wird `ScrollToBottomEvent` emittiert.
  → Grund: Der Timeline-Widget-Tree kann über Filter-Wechsel hinweg gemountet bleiben, daher ist `initState` alleine zu wenig.

Wirkung: Flat-Bucket-Timeline funktioniert, Scrubber zeigt Daten aufsteigend statt absteigend; innerhalb eines Tages sind Assets ältester → neuester sortiert. Jede neu geöffnete Ansicht beginnt unten beim neuesten Asset; jeder Filterwechsel im Photos-Tab springt ebenfalls an den unteren Rand.

---

## 14. Cloud/Lokal/LivePhoto-Badges in Galerie ausblenden (Fullscreen-Header zeigen)

Badges in der Grid-Ansicht (Cloud-Status, LivePhoto-Glyph) werden versteckt wenn `Setting.hideAssetBadges` aktiv ist. In der Vollbild-Detail-Ansicht werden die gleichen Icons im Top-App-Bar neben dem Favoriten-Herz eingeblendet.

#### `mobile/lib/presentation/widgets/images/thumbnail_tile.widget.dart`
- In `build()`: neue Variable `hideAssetBadges = ref.watch(settingsProvider.select((s) => s.get(Setting.hideAssetBadges)))`.
- `storageIndicator` um `&& !hideAssetBadges` erweitert.
- `_AssetTypeIcons` erhält Parameter `hideBadges`; `isLivePhoto`-Zweig nur wenn `!hideBadges`.

#### `mobile/lib/widgets/asset_grid/thumbnail_image.dart` (Legacy)
- Import `store.model.dart`, `store.entity.dart`.
- `if (showStorageIndicator)` → `if (showStorageIndicator && !Store.get(StoreKey.hideAssetBadges, true))`.

#### `mobile/lib/presentation/widgets/asset_viewer/viewer_top_app_bar.widget.dart`
- `isLivePhoto` + `storageIcon` berechnen.
- Neue `_ViewerBadgeIcon`-Helper-Klasse (weiß, 22 px, horizontal-padding 4).
- Vor den Favoriten-Buttons: `_ViewerBadgeIcon(icon: storageIcon)` und optional `_ViewerBadgeIcon(icon: Icons.motion_photos_on_rounded)` für LivePhoto.

---

## 15. Memories-Lane ausblenden + „Rückblicke"-Ordner in Alben

#### `mobile/lib/presentation/pages/dev/main_timeline.page.dart`
- Imports ergänzt (`setting.model.dart`, `setting.provider.dart`, `timeline.provider.dart`, `photos_filter.provider.dart`, `user.provider.dart`, `immich_sliver_app_bar.dart`, `photos_filter_title.dart`).
- Widget in `ConsumerWidget` umgebaut, wenn `hideMemoriesLane` aktiv → keine `DriftMemoryLane` im `topSliverWidget`.
- Filter-Switch (siehe Abschnitt 18): wenn Filter ≠ `all`, Memories-Lane ebenfalls ausblenden.

#### `mobile/lib/pages/photos/photos.page.dart` (Legacy)
- Imports (`store.model.dart`, `store.entity.dart`) + `flutter_hooks` mit `hide Store`.
- `(currentUser != null && currentUser.memoryEnabled && !Store.get(StoreKey.hideMemoriesLane, true))` als Guard.

#### `mobile/lib/widgets/memories/rueckblicke_folder.dart` *(NEU)*
`ConsumerWidget` `RueckblickeFolder`. Gated via `Store.get(StoreKey.showMemoriesFolder, true)`. Rendert einen Card-Tile oben in der Alben-Liste; Tap öffnet ein `DraggableScrollableSheet` mit allen Memories. Tap auf Memory-Eintrag → `DriftMemoryRoute(memories: ..., memoryIndex: i)`.

#### `mobile/lib/presentation/pages/drift_album.page.dart`
- Import `rueckblicke_folder.dart`.
- Im `CustomScrollView.slivers`: `const RueckblickeFolder()` direkt vor `AlbumSelector(...)`.

#### i18n-Keys
`memories_folder_title`, `memories_folder_subtitle` (plural), `memories_folder_this_year`, `memories_folder_years_ago` (mit `{years}`-Argument), `memories_folder_asset_count` (plural).

---

## 16. Scroll-Restore: Galerie auf letztes Bild zentrieren

Beim Schließen der Fullscreen-Asset-Ansicht scrollt die Timeline im Hintergrund so, dass das zuletzt angeschaute Asset mittig im Viewport ist.

#### `mobile/lib/domain/models/events.model.dart`
Neues Event:
```dart
class RestoreAssetIndexEvent extends Event {
  final int index;
  const RestoreAssetIndexEvent(this.index);
}
```

#### `mobile/lib/presentation/widgets/asset_viewer/asset_viewer.page.dart`
- Imports `store.model.dart`, `store.entity.dart`.
- In `dispose()` vor den übrigen Aufräumarbeiten:
  ```dart
  if (Store.get(StoreKey.scrollRestoreOnViewerClose, true)) {
    EventStream.shared.emit(RestoreAssetIndexEvent(_currentPage));
  }
  ```

#### `mobile/lib/presentation/widgets/timeline/timeline.widget.dart`
- In `_onEvent` neuer Case:
  ```dart
  case RestoreAssetIndexEvent restore:
    _restoreAssetIndex = restore.index;
    _restoreAssetPosition(_scrollController);
  ```
- `_restoreAssetPosition` berechnet nun **zentrierten** Offset statt Top-Alignment: `centered = rowTopOffset - (viewport/2) + (tileHeight/2)`, `tileHeight` aus `TimelineArgs` (`maxWidth - spacing*(cols-1)) / cols`.

---

## 17. Orte-Kachel springt direkt zur Karte

Die Kachel "Orte" in der Bibliothek öffnet direkt `DriftMapRoute` statt `DriftPlaceRoute`. Weltansicht wenn keine gespeicherte Position, sonst letzte Kamera-Position.

#### `mobile/lib/presentation/pages/drift_library.page.dart`
- Imports `store.model.dart`, `store.entity.dart`.
- In `_PlacesCollectionCard`:
  - `directToMap = Store.get(StoreKey.placesDirectToMap, true)`.
  - `cameraString` aus `StoreKey.lastMapCamera` lesen, parsen zu `lat,lng,zoom`.
  - `MapThumbnail(zoom: previewZoom, centre: previewCentre, ...)` — Weltansicht wenn `!hasValidLast` (zoom 0.5, center 0,0).
  - `onTap`: bei `directToMap=true` → `DriftMapRoute(initialLocation: hasValidLast ? LatLng(..) : null)`, sonst alter `DriftPlaceRoute`-Flow.

#### `mobile/lib/presentation/widgets/map/map.widget.dart`
- Imports `store.model.dart`, `store.entity.dart`.
- In `onMapMoved()` direkt nach dem `isCameraMoving`-Guard die Kamera-Position serialisieren:
  ```dart
  final camera = mapController!.cameraPosition;
  if (camera != null) {
    Store.put(StoreKey.lastMapCamera,
      '${camera.target.latitude},${camera.target.longitude},${camera.zoom}');
  }
  ```

(`StoreKey.lastMapCamera` als String wegen des 4-Typen-Limits im Store — int/String/bool/DateTime.)

---

## 18. Filter-Menü „Alle" im Fotos-Header

Titel des `ImmichSliverAppBar` in der Photos-Tab durch ein klickbares Label ersetzt. Tap öffnet Bottom-Sheet mit: Alle / Favoriten / Videos / Bilder + benutzerkonfigurierbare Remote-Alben. Filter wird **nicht** persistiert (Reset auf "Alle" bei App-Neustart).

#### `mobile/lib/providers/timeline/photos_filter.provider.dart` *(NEU)*
- Enum `PhotosFilterMode { all, favorites, videos, images, album }`.
- `PhotosFilterState(mode, albumId)` + `PhotosFilterNotifier` (Notifier) mit `reset()`, `setMode(mode)`, `setAlbum(id)`.
- `photosFilterProvider = NotifierProvider<PhotosFilterNotifier, PhotosFilterState>`.

#### `mobile/lib/widgets/common/photos_filter_title.dart` *(NEU)*
- `PhotosFilterTitle` — zeigt aktuelles Filter-Label + Chevron; Tap öffnet `showModalBottomSheet`.
- Sheet listet die vier Built-in-Modi, dann Divider, dann die aus `StoreKey.photosFilterAlbumIds` (comma-separated) gefilterten Remote-Alben (aus `remoteAlbumProvider`).

#### `mobile/lib/infrastructure/repositories/timeline.repository.dart`
Neue Methode `image(String userId, GroupAssetsBy groupBy)` — wie `video()`, nur mit `row.type.equalsValue(AssetType.image)`.

#### `mobile/lib/domain/services/timeline.service.dart`
Neue Factory-Methode `TimelineService image(String userId) => TimelineService(_timelineRepository.image(userId, groupBy));`.

#### `mobile/lib/presentation/pages/dev/main_timeline.page.dart`
- `appBar = ImmichSliverAppBar(... title: PhotosFilterTitle())`.
- Wenn Filter `all`: normale Timeline rendern (verwendet den Default-`timelineServiceProvider`).
- Sonst: `ProviderScope` mit `timelineServiceProvider.overrideWith(...)` — liest `currentUserProvider`, wählt `factory.favorite/video/image/remoteAlbum` basierend auf `filter.mode`, gibt `ref.onDispose(service.dispose)`.

#### i18n-Keys
`photos_filter_all`, `photos_filter_favorites`, `photos_filter_videos`, `photos_filter_images` (EN + DE).

---

## 19. iOS → Server Favoriten-Sync

Überträgt nach jedem Sync die `is_favorite`-Flagge aus dem iOS-Photos-Library (bereits in `local_asset_entity.is_favorite` gespeichert) auf die matching Remote-Assets auf dem Immich-Server. Richtung nur iOS → Server.

#### `mobile/lib/domain/services/ios_favorite_sync.service.dart` *(NEU)*
Klasse `IosFavoriteSyncService({required Drift db, required AssetApiRepository assetApi})` mit einer Methode:
- `syncFavoritesToServer()` — früh-return wenn `!isIOS` oder `!syncIosFavorites`. Führt eine `customSelect` Query aus, die `local_asset_entity` und `remote_asset_entity` über `checksum` joint und Zeilen mit `is_favorite`-Unterschied zurückgibt. Trennt die IDs in `toFavorite`/`toUnfavorite` und ruft `assetApi.updateFavorite(ids, bool)` für beide Gruppen.

#### `mobile/lib/providers/infrastructure/sync.provider.dart`
- Imports ergänzt.
- Neuer Provider:
  ```dart
  final iosFavoriteSyncServiceProvider = Provider(
    (ref) => IosFavoriteSyncService(
      db: ref.watch(driftProvider),
      assetApi: ref.watch(assetApiRepositoryProvider),
    ),
  );
  ```

#### `mobile/lib/domain/utils/background_sync.dart`
Neue Methode `syncIosFavorites()` auf `BackgroundSyncManager`. Ruft `runInIsolateGentle(ref.read(iosFavoriteSyncServiceProvider).syncFavoritesToServer)`. Fehler werden geschluckt (best-effort).

#### `mobile/lib/providers/app_life_cycle.provider.dart`
- Nach dem existierenden `syncLinkedAlbum`-Block:
  ```dart
  await _safeRun(backgroundManager.syncIosFavorites(), "syncIosFavorites");
  ```

---

## 20. iOS Hidden-Album → Server Locked Folder

Das Feature ist wieder aktiv. Zielverhalten:
- Wenn `syncIosHiddenToLockedFolder` **an** ist (Immich+-Default), liest der iOS-Sync das echte Hidden-Smart-Album mit `includeHiddenAssets`, markiert dieses Album automatisch als Backup-Quelle und lädt dessen Fotos/Videos über die normale Upload-Pipeline hoch.
- Danach werden bereits hochgeladene Server-Assets, deren Checksumme zu einem Hidden-Asset passt, serverseitig in den Immich-Locked-Folder verschoben.
- Wenn iOS den Hidden-Ordner noch per Face ID / Touch ID / Code schützt, liefert Apple für Apps weiterhin ein leeres Hidden-Album zurück. In diesem Fall zeigt `ImmichPlusSettings` direkt unter dem Toggle einen Hinweistext mit dem exakten Pfad `Einstellungen > Apps > Fotos > …`, damit der Schutz kurzzeitig deaktiviert, der Upload abgeschlossen und der Schutz danach wieder aktiviert werden kann.
- Einen **öffentlichen** iOS-Direktlink genau auf diese Photos-Systemseite gibt es nicht; deshalb wird bewusst **kein** privater URL-Hack verwendet, sondern nur die Anleitung plus Refresh.

Technisch relevante Änderungen:
- `mobile/pigeon/native_sync_api.dart` + `MessagesImpl.swift`: neues `setIncludeHiddenAssets(bool)`; alle Album-/Asset-Fetches respektieren die Einstellung.
- `mobile/ios/Runner/Sync/HiddenAlbumPlugin.swift`: liefert Hidden-Album-ID und aktuelle Hidden-Asset-IDs per MethodChannel.
- `mobile/lib/domain/services/local_sync.service.dart`: synchronisiert das Hidden-Album bei aktivem Toggle in **jedem** lokalen iOS-Sync gezielt mit, damit ein temporär entsperrter Hidden-Ordner noch im selben Lauf als Backup-Quelle wirksam wird.
- `mobile/lib/domain/services/ios_hidden_sync.service.dart`: verschiebt passende Remote-Assets nach dem Upload in den Locked Folder.
- `mobile/lib/widgets/settings/immich_plus_settings/immich_plus_settings.dart`: Toggle wieder sichtbar; Leerzustand zeigt den Hinweis-Card an.

---

## 21. Log-Detailansicht mit Asset-Info

Log-Einträge können mit Asset-ID und/oder Asset-Pfad angereichert werden. Die Log-Detailseite zeigt die Info als kopierbare Zeilen. Keine Schema-Änderung — Info wird als Sentinel-String in der Message transportiert.

#### `mobile/lib/utils/log_asset_context.dart` *(NEU)*
Klasse `LogAssetContext`:
- `format({String? id, String? path}) -> String` → gibt z.B. `" [ASSET_ID:abc] [ASSET_PATH:/foo]"` zurück.
- `extract(LogMessage) -> ({String? assetId, String? assetPath})` durchsucht `message` und `error` nach den Sentinels.

Neue Logging-Aufrufe sollen Asset-Kontext via `log.severe('Upload failed' + LogAssetContext.format(id: id, path: path))` anhängen.

#### `mobile/lib/pages/common/app_log_detail.page.dart`
- Import `log_asset_context.dart`.
- Vor der Anzeige der Logger/Stack-Zeilen: `final assetCtx = LogAssetContext.extract(logMessage);`
- Zusätzliche `buildTextWithCopyButton("ASSET ID", ctx.assetId!)` / `"ASSET PATH"`-Sektionen wenn vorhanden.

---

## 21c. Alben mit gleichem Namen zusammenfassen

Duplikate (gleicher Name, case-insensitive, getrimmt) werden überall in der UI zu einem Eintrag reduziert. Innerhalb einer Gruppe gilt das Album mit dem neuesten `updatedAt` als **primary** — das ist was angezeigt wird und wohin neue Fotos gehen wenn der User das Album auswählt.

#### `mobile/lib/utils/album_group.dart` *(NEU)*
- `class RemoteAlbumGroup { RemoteAlbum primary; List<RemoteAlbum> duplicates; Set<String> ids; int totalAssetCount; }`
- `groupAlbumsByName(Iterable<RemoteAlbum>)` → `List<RemoteAlbumGroup>`. Normalisiert Namen mit `.trim().toLowerCase()`, innerhalb einer Gruppe nach `updatedAt desc` sortiert → Erstes = primary.

#### `mobile/lib/widgets/common/photos_filter_title.dart`
- Import `album_group.dart`.
- `_openSheet`: statt `filterAlbums.map(…)` jetzt `groupAlbumsByName(…)` → Eine Zeile pro Namens-Gruppe. Tap speichert die **primary-ID** als Filter; `selected` wird true wenn der aktive Filter **irgendeine** ID aus der Gruppe matcht.
- Bottom-Sheet: `isScrollControlled: true` + `DraggableScrollableSheet(initialChildSize: 0.55, maxChildSize: 0.9)` + `ListView(controller: scrollController, …)`. Fix für Scrollen bei > 4 konfigurierten Alben.

#### `mobile/lib/widgets/settings/immich_plus_settings/immich_plus_settings.dart`
- Import `album_group.dart`.
- `_PhotosFilterAlbumsSection`: gruppiert per `groupAlbumsByName`, filtert Gruppen mit `totalAssetCount == 0` weg, sortiert alphabetisch nach primary-Name.
- Eine Checkbox pro Gruppe; `value = group.ids.any(selected.contains)`; onChanged speichert/entfernt **alle** IDs der Gruppe in einem Schritt. Subtitle: `"<Owner> · <totalCount>"` + ggf. `"+<n>"` wenn Duplikate.

#### `mobile/lib/presentation/widgets/album/album_selector.widget.dart`
- `sortAlbums()`: nach dem normalen Sort zusätzlich pro `name.trim().toLowerCase()` deduplizieren — das erste Album pro Gruppe bleibt, die übrigen fallen raus. Unter dem Default `lastModified desc` landet damit automatisch das zuletzt aktualisierte Duplikat als einziger sichtbarer Eintrag. Add-to-Album-Flows rufen dann `addAssets(primary.id, …)`, sodass neue Fotos immer ins selbe (primäre) Album gehen.

---

## 21b. Album-Default-Sortierung + leere Alben ausfiltern

Default-Sortierung der Alben-Übersicht auf `lastModified desc` geändert — das Album, zu dem zuletzt ein Asset hinzugefügt wurde (Server bumped `album.updatedAt`), erscheint ganz oben. Leere Alben (`assetCount == 0`) werden ausgeblendet; außerdem zeigt die Filter-Auswahl pro Album Owner + Asset-Count, damit gleichnamige Alben unterscheidbar sind.

#### `mobile/lib/services/app_settings.service.dart`
- `selectedAlbumSortOrder`: default `2` (mostRecent) → `3` (**lastModified**, `AlbumSortMode.lastModified.storeIndex`).
- `selectedAlbumSortReverse`: default `true` → **`false`**.
  `AlbumSortMode.lastModified.defaultOrder = SortOrder.desc`; mit `isReverse=false` bleibt die effektive Order `desc` → neueste Albumänderung oben.

#### `mobile/lib/presentation/widgets/album/album_selector.widget.dart`
- Initial state `sort = AlbumSort(mode: AlbumSortMode.lastModified, isReverse: false)`.
- `sortAlbums()`: Quelle wird auf `albums.where((a) => a.assetCount > 0).toList()` reduziert, bevor sie an `sortAlbums` (Service) übergeben wird. Leere Alben verschwinden aus der Liste (sie kommen aus Server-Sync, hätten unter `lastModified desc` alle dasselbe Timestamp wie das letzte Sync-Ereignis und würden die Ansicht zuschütten).

#### `mobile/lib/widgets/settings/immich_plus_settings/immich_plus_settings.dart`
- `_PhotosFilterAlbumsSection.build()`:
  - Filtert `assetCount > 0` weg.
  - Sortiert nach `name` (case-insensitive), bei Gleichstand nach `ownerName`, sodass gleichnamige Alben nebeneinander erscheinen.
  - `CheckboxListTile.subtitle` zeigt `"<ownerName> · <assetCount>"`, damit Duplikate unterscheidbar sind (z.B. zwei Alben mit dem Namen "Sommer" — eins eigen, eins geteilt).

---

## 22. Immich+ Settings-Seite (Überarbeitung)

Alle Immich+ Toggles sind jetzt auf einer Seite gruppiert nach „Darstellung" und „Datensynchronisation", jeweils mit Untertitel-Erklärung. Zusätzlich Mehrfach-Auswahl aller Remote-Alben, die im Filter-Menü (Abschnitt 18) erscheinen sollen.

#### `mobile/lib/widgets/settings/immich_plus_settings/immich_plus_settings.dart`
Komplett neu geschrieben. Struktur:
- `SettingGroupTitle "Darstellung"` → 10 Switches (`showHeaderImage`, `hideAssetBadges`, `hideMemoriesLane`, `showMemoriesFolder`, `scrollRestoreOnViewerClose`, `placesDirectToMap`, `reverseTimeline`, `showSyncNotifications`, `disable grouping`, `logsShowAssetDetail`).
- `SettingGroupTitle "Datensynchronisation"` → `syncIosFavorites`.
- Abschließend die neue `_PhotosFilterAlbumsSection` — liest `remoteAlbumProvider` und rendert eine Checkbox-Liste; Selection wird als comma-separated String in `StoreKey.photosFilterAlbumIds` persistiert.

Nach Änderungen werden `appSettingsServiceProvider` und `settingsProvider` invalidiert.

#### i18n-Keys
Siehe Abschnitt 23 für die komplette Liste. Deutsch + Englisch vollständig.

---

## 23. Übersetzungen (i18n) — neue Keys (Batch 2)

### `i18n/en.json`
```json
"change_server_url_error": "Could not reach that server. Check the URL and try again.",
"change_server_url_subtitle": "Point the app at a different Immich server URL without logging out. The access token stays in place.",
"change_server_url_success": "Server URL updated",
"change_server_url_title": "Change server URL",

"immich_plus_filter_albums_empty": "No albums available. Create or sync albums first.",
"immich_plus_filter_albums_subtitle": "Albums selected here appear as extra entries in the Photos tab filter menu.",
"immich_plus_filter_albums_title": "Custom albums in filter menu",
"immich_plus_group_sync": "Data sync",
"immich_plus_group_ui": "Appearance",
"immich_plus_hide_asset_badges_subtitle": "Hide cloud/local/LivePhoto indicators in the gallery grid. They remain visible in the fullscreen viewer.",
"immich_plus_hide_asset_badges_title": "Hide badges in gallery",
"immich_plus_hide_memories_lane_subtitle": "Hide the \"X years ago\" strip at the top of the Photos tab.",
"immich_plus_hide_memories_lane_title": "Hide memories strip",
"immich_plus_logs_asset_detail_subtitle": "Show asset id and path in log entries when available, with copy support.",
"immich_plus_logs_asset_detail_title": "Expand log detail with asset info",
"immich_plus_places_direct_to_map_subtitle": "Tap \"Places\" to jump straight to the world map; the last viewed location is remembered.",
"immich_plus_places_direct_to_map_title": "Places opens the map directly",
"immich_plus_reverse_timeline_subtitle": "Newest photos appear at the bottom-right of the grid.",
"immich_plus_reverse_timeline_title": "Reverse timeline order",
"immich_plus_scroll_restore_subtitle": "When closing an asset, scroll the gallery so the last viewed asset is centered.",
"immich_plus_scroll_restore_title": "Scroll back to last viewed asset",
"immich_plus_show_memories_folder_subtitle": "Show a \"Memories\" folder at the top of the Albums tab.",
"immich_plus_show_memories_folder_title": "Memories folder in Albums",
"immich_plus_sync_ios_favorites_subtitle": "Copy the Favorite flag from the iOS Photos app to the Immich server. iOS → server only.",
"immich_plus_sync_ios_favorites_title": "Sync iOS favorites to server",

"memories_folder_asset_count": "{count, plural, one {# item} other {# items}}",
"memories_folder_subtitle": "{count, plural, one {# memory} other {# memories}}",
"memories_folder_this_year": "Earlier this year",
"memories_folder_title": "Memories",
"memories_folder_years_ago": "{years} years ago",

"photos_filter_all": "All",
"photos_filter_favorites": "Favorites",
"photos_filter_images": "Photos",
"photos_filter_videos": "Videos"
```

### `i18n/de.json`
Gleiche Keys mit deutschen Übersetzungen:
```json
"change_server_url_error": "Server nicht erreichbar. Überprüfe die URL.",
"change_server_url_subtitle": "App auf eine andere Immich-Server-URL umstellen, ohne sich abmelden zu müssen. Der Zugriffs-Token bleibt bestehen.",
"change_server_url_success": "Server-URL aktualisiert",
"change_server_url_title": "Server-URL ändern",

"immich_plus_filter_albums_empty": "Keine Alben verfügbar. Erstelle oder synchronisiere zuerst Alben.",
"immich_plus_filter_albums_subtitle": "Ausgewählte Alben erscheinen zusätzlich im Filter-Menü der Fotos-Ansicht.",
"immich_plus_filter_albums_title": "Eigene Alben im Filter-Menü",
"immich_plus_group_sync": "Datensynchronisation",
"immich_plus_group_ui": "Darstellung",
"immich_plus_hide_asset_badges_subtitle": "Blendet die Cloud-/Lokal-/LivePhoto-Symbole in der Galerie-Übersicht aus. In der Vollbild-Ansicht bleiben sie sichtbar.",
"immich_plus_hide_asset_badges_title": "Badges in der Galerie ausblenden",
"immich_plus_hide_memories_lane_subtitle": "Blendet die „Vor X Jahren"-Leiste oben auf der Fotos-Seite aus.",
"immich_plus_hide_memories_lane_title": "Rückblick-Leiste ausblenden",
"immich_plus_logs_asset_detail_subtitle": "Zeigt Asset-ID und -Pfad in Log-Einträgen an, mit Kopier-Funktion.",
"immich_plus_logs_asset_detail_title": "Log-Detail mit Asset-Info",
"immich_plus_places_direct_to_map_subtitle": "Tippen auf „Orte\" öffnet direkt die Weltkarte; der letzte Ort wird gemerkt.",
"immich_plus_places_direct_to_map_title": "„Orte\" öffnet direkt die Karte",
"immich_plus_reverse_timeline_subtitle": "Neueste Fotos erscheinen unten rechts im Raster.",
"immich_plus_reverse_timeline_title": "Sortierung umkehren",
"immich_plus_scroll_restore_subtitle": "Beim Schliessen eines Bildes scrollt die Galerie so, dass das zuletzt angeschaute Bild zentriert ist.",
"immich_plus_scroll_restore_title": "Zum letzten Bild zurückscrollen",
"immich_plus_show_memories_folder_subtitle": "Zeigt einen Ordner „Rückblicke\" oben in der Alben-Ansicht.",
"immich_plus_show_memories_folder_title": "Rückblicke-Ordner in Alben",
"immich_plus_sync_ios_favorites_subtitle": "Überträgt Favoriten-Markierungen aus der iOS Fotos-App auf den Immich-Server. Nur iOS → Server.",
"immich_plus_sync_ios_favorites_title": "iOS-Favoriten zum Server synchronisieren",

"memories_folder_asset_count": "{count, plural, one {# Element} other {# Elemente}}",
"memories_folder_subtitle": "{count, plural, one {# Rückblick} other {# Rückblicke}}",
"memories_folder_this_year": "Früher dieses Jahr",
"memories_folder_title": "Rückblicke",
"memories_folder_years_ago": "Vor {years} Jahren",

"photos_filter_all": "Alle",
"photos_filter_favorites": "Favoriten",
"photos_filter_images": "Bilder",
"photos_filter_videos": "Videos"
```

---

## 24. Albumbasierte Galerie-Filter (Person, Nur Fotos, Medientyp)

Aktuelle Implementierung fuer die iOS-Hauptgalerie nach der Server-Umstellung auf Spezialalben. Wichtig: Es gibt **keine** Sync-Protokoll-Erweiterung, keine `deviceId`-Spalte in `remote_asset_entity` und keine lokalen EXIF-`tags`. Die Filter laufen lokal ueber die bereits synchronisierten Tabellen `remote_album_entity` und `remote_album_asset_entity`.

Kanonische Kurz-Spec fuer diesen Block: `MOBILE_FILTERS_SPEC.md`.

#### Server-Vertrag
- `_filter:rachel` / `076697f9-02b8-4d3c-82b4-f3dd091c455e`
- `_filter:documents` / `ee826b7c-c248-4242-aaf0-5fd1c63e4ccc`
- `_filter:screenshots` / `b4efee8d-7a7d-4baf-9904-6f3241830f0c`
- `_filter:documentation` / `5d15c12a-0e6e-42c6-8a75-d4ab7788f7dc`

#### Neue Dateien
- `mobile/lib/config/filter_albums.dart`: zentrale IDs plus `isFilterAlbumName()`.
- `mobile/lib/domain/models/filter/filter_types.dart`: `PersonFilterType { all, chris, rachel }`, `MediaTypeFilterType { all, images, videos }`.
- `mobile/lib/providers/filter.provider.dart`: persistente Notifier fuer Person, Medientyp und `showOnlyPhotos`.
- `mobile/lib/presentation/pages/filter_album.page.dart`: schlanke Timeline-Seite fuer die drei Bibliotheks-Shortcuts.

#### Persistenz
- `mobile/lib/domain/models/store.model.dart`: neue StoreKeys `personFilter` (1033), `mediaTypeFilter` (1034), `showOnlyPhotos` (1035).
- `mobile/lib/services/app_settings.service.dart`: Defaults `Person=Alle`, `Medientyp=Alle`, `Nur Fotos=true`.

#### Drift/Timeline
- `mobile/lib/infrastructure/entities/merged_asset.drift`: `mergedAsset` und `mergedBucket` nehmen optionale Filterparameter an. Remote-Assets werden ueber `EXISTS`/`NOT EXISTS` auf `remote_album_asset_entity` gefiltert; Bucket-Counts und Assetliste verwenden dieselbe Semantik.
- Bei aktivem Personfilter werden lokale, noch nicht synchronisierte Assets im lokalen UNION-Zweig ausgeblendet, weil sie keiner Person/Server-Albumzuordnung zugeordnet werden koennen.
- `mobile/lib/infrastructure/repositories/timeline.repository.dart`: `DriftTimelineFilters` und Durchreichen der Parameter an beide Drift-Queries.
- `mobile/lib/domain/services/timeline.service.dart`: `TimelineFactory.main(...)` nimmt Asset-Typ, Rachel-Album und Auto-Tag-Alben entgegen.
- `mobile/lib/domain/services/timeline.service.dart`: `TimelineService.replaceQuery(...)` haelt die Hauptgalerie beim Filterwechsel als stabiles Service-Objekt und ersetzt nur die lokale Query. Buckets werden ueber einen Controller erst nach geladenem Puffer ausgespielt, damit die Galerie nicht auf den Vollbild-Spinner zurueckfaellt.
- Nach Drift-Aenderungen `dart run build_runner build --delete-conflicting-outputs` im `mobile/` Verzeichnis ausfuehren.

#### UI
- `mobile/lib/presentation/pages/dev/main_timeline.page.dart`: Filterleiste direkt unter der Photos-AppBar, nur in `PhotosFilterMode.all`. Alte Header-Modi `Favoriten`, `Videos`, `Bilder` und `Album` verwenden ihre bestehenden Timeline-Services und bekommen keine unsichtbar weiterwirkenden Person/Nur-Fotos-Filter.
- `mobile/lib/providers/infrastructure/timeline.provider.dart`: Default-`timelineServiceProvider` baut die Hauptgalerie-Query aus `photosFilterProvider`, Personfilter, Medientyp und `showOnlyPhotos`, gibt aber fuer die Hauptgalerie dasselbe `TimelineService`-Objekt weiter.
- Person-Auswahl: `Alle / Chris / Rachel`; `Chris` bedeutet "nicht im Rachel-Album", `Rachel` bedeutet "im Rachel-Album".
- Medientyp-Auswahl: `Alle / Bilder / Videos`.
- `Nur Fotos` blendet Dokumente, Screenshots und Dokumentationen standardmaessig aus.
- `mobile/lib/presentation/widgets/timeline/timeline.widget.dart`: `monthSegmentSnappingOffset` klammert `topSliverWidgetHeight` korrekt, damit die neue Top-Sliver-Filterleiste den Scrubber nicht verschiebt.
- `mobile/lib/presentation/pages/drift_library.page.dart`: Shortcuts `Screenshots`, `Dokumente`, `Dokumentationen` oeffnen `FilterAlbumPage` mit der jeweiligen Spezialalbum-ID.

#### Spezialalben aus normalen Listen ausblenden
- `mobile/lib/pages/albums/albums.page.dart`
- `mobile/lib/presentation/widgets/album/album_selector.widget.dart`
- `mobile/lib/widgets/common/photos_filter_title.dart`
- `mobile/lib/widgets/settings/immich_plus_settings/immich_plus_settings.dart`

#### Tests/Checks vom Bugfix-Run 2026-04-26
- `git diff --check`
- `mise exec -- flutter analyze ...` fuer die betroffenen Filter-/Timeline-Dateien
- `mise exec -- flutter test test/infrastructure/repositories/merged_asset_drift_test.dart`
- `mise exec -- flutter test test/domain/repositories/sync_stream_repository_test.dart test/infrastructure/repositories/sync_api_repository_test.dart test/domain/services/sync_stream_service_test.dart`

---

## Zusammenfassung der Funktionsänderungen

| Feature | Wo in den Settings | Default |
|---|---|---|
| ImmichPlus Anpassungen (Übersichtsseite) | Einstellungen → "ImmichPlus Anpassungen" (ganz oben) | - |
| Gruppierung "Keine" | ImmichPlus Anpassungen → "Datumsgruppierung deaktivieren" | Aus |
| Header-Image ausblenden | ImmichPlus Anpassungen → "Titelbild anzeigen" | An |
| Sync-Notifications ausblenden | ImmichPlus Anpassungen → "Sync-Benachrichtigungen anzeigen" | An |
| Badges in Galerie ausblenden | ImmichPlus Anpassungen → "Badges in der Galerie ausblenden" | An |
| Memories-Lane ausblenden | ImmichPlus Anpassungen → "Rückblick-Leiste ausblenden" | An |
| Rückblicke-Ordner in Alben | ImmichPlus Anpassungen → "Rückblicke-Ordner in Alben" | An |
| Scroll-Restore beim Schliessen | ImmichPlus Anpassungen → "Zum letzten Bild zurückscrollen" | An |
| Orte → direkt zur Karte | ImmichPlus Anpassungen → "„Orte" öffnet direkt die Karte" | An |
| Timeline umkehren | ImmichPlus Anpassungen → "Sortierung umkehren" | An |
| Log-Detail mit Asset-Info | ImmichPlus Anpassungen → "Log-Detail mit Asset-Info" | An |
| iOS-Favoriten → Server | ImmichPlus Anpassungen → "iOS-Favoriten zum Server synchronisieren" | An |
| Eigene Alben im Filter-Menü | ImmichPlus Anpassungen → Checkbox-Liste unten | Leere Auswahl |
| Albumbasierte Galerie-Filter | Fotos-Tab, direkt unter dem Header | Nur Fotos an, Person/Medientyp Alle |
| Delete ohne Bestätigung | Nicht in Settings (Always-on) | An |
| Video-Zeit-Overlay ohne führende Nullen | Nicht in Settings (Always-on) | An |
| Tap-to-top (iOS Statusbar) | Nicht in Settings (Always-on) | An |
| Server-URL ohne Logout ändern | Einstellungen → Netzwerk → Stift-Icon | An |
| Bundle ID Rebranding | Nicht in Settings, Build-Konfiguration | app.immichplus |

---

## Reihenfolge für Re-Implementation nach neuem Fork

Bei einem erneuten Fork von Upstream-Immich in dieser Reihenfolge vorgehen:

1. **Abschnitt 1**: Bundle Identifier überall ersetzen. DEVELOPMENT_TEAM anpassen.
2. **Abschnitt 8**: StoreKeys und AppSettingsEnum anlegen — jede spätere Änderung nutzt diese Schlüssel.
3. **Abschnitt 3**: `showHeaderImage`-Toggle verdrahten (3 Sliver-AppBar-Widgets).
4. **Abschnitt 4**: `showSyncNotifications`-Toggle verdrahten.
5. **Abschnitt 2**: `GroupAssetsBy.none` freischalten.
6. **Abschnitt 9**: Delete ohne Confirm (1-Zeilen-Änderung in `bottom_bar.widget.dart`).
7. **Abschnitt 10**: Video-Format — `DurationFormatExtension.format()` umschreiben.
8. **Abschnitt 11**: `TapToTopOverlay` anlegen und in beide Tab-Scaffolds einfügen.
9. **Abschnitt 12**: `ChangeServerUrlDialog` anlegen, in `networking_settings.dart` verdrahten.
10. **Abschnitt 13**: `_wrapReversibleTimeline()` auf *alle* `TimelineFactory`-Methoden anwenden; `ScrollToBottomEvent` definieren; `_pendingScrollToBottom` + `_maybeScrollToBottom()` in `_SliverTimelineState`; Filter-Listener in `MainTimelinePage`.
11. **Abschnitt 14**: Badge-Sichtbarkeit in beiden Thumbnail-Widgets, Icons in Viewer-Top-Bar.
12. **Abschnitt 15**: Memories ausblenden in Main-Timeline + Photos-Page; `RueckblickeFolder` in `drift_album.page.dart` einfügen.
13. **Abschnitt 16**: `RestoreAssetIndexEvent` definieren, im Viewer-`dispose` emittieren, in Timeline-`_onEvent` konsumieren.
14. **Abschnitt 17**: `_PlacesCollectionCard` anpassen + `onMapMoved` in `map.widget.dart`.
15. **Abschnitt 18**: Filter-Provider, `PhotosFilterTitle`, `image()`-Factory + ProviderScope in `MainTimelinePage`.
15b. **Abschnitt 24**: `FilterAlbums`, persistente Hauptgalerie-Filter, `mergedAsset`/`mergedBucket` Albumfilter, Bibliotheks-Shortcuts und Ausblenden der `_filter:*`-Alben nachziehen; danach Drift-Codegen und die Abschnitt-24-Tests ausfuehren.
16. **Abschnitt 19**: `IosFavoriteSyncService` + Provider + BackgroundSyncManager-Methode + Hook in `app_life_cycle.provider.dart`.
17. **Abschnitt 20**: HiddenAlbumPlugin registrieren, `syncIosHiddenToLockedFolder` wieder verdrahten, `setIncludeHiddenAssets(bool)` in Pigeon/Swift ergänzen, Hidden-Album im lokalen Sync immer gezielt mitziehen und den Leerzustand in `ImmichPlusSettings` anzeigen.
18. **Abschnitt 21**: `LogAssetContext` anlegen, Log-Detailseite erweitern.
18b. **Abschnitt 21b**: `selectedAlbumSortOrder`=3 und `selectedAlbumSortReverse`=false in `app_settings.service.dart`; Initialer `AlbumSort` in `album_selector.widget.dart` auf `isReverse: false`.
19. **Abschnitt 22**: `ImmichPlusSettings`-Widget komplett neu schreiben.
20. **Abschnitt 6 + 23**: i18n-Keys in `en.json` + `de.json` alphabetisch einsortieren.
21. **iOS build**: `cd mobile/ios && pod install` um `Podfile.lock` zu regenerieren.

Nach Schritt 21 sollte `flutter analyze` im `mobile/` Unterverzeichnis 0 Fehler/Warnungen in `lib/` liefern (Baseline: Pre-existing Fehler in `packages/ui/showcase/` sind nicht von Immich+ abhängig).
