# Mobile-Spec: Albumbasierte Filter

Diese Notiz dokumentiert die aktuelle Immich+-Mobile-Implementierung fuer die Hauptgalerie-Filter.

## Server-Vertrag

Die Mobile-App erweitert den Sync-Stream nicht. Es gibt keine neuen Felder in `SyncAssetV1`, keine `deviceId`-Spalte in `remote_asset_entity` und keine lokalen EXIF-`tags` fuer diese Filter.

Der Server pflegt stattdessen diese Spezialalben:

- Rachel: `_filter:rachel` / `076697f9-02b8-4d3c-82b4-f3dd091c455e`
- Dokumente: `_filter:documents` / `ee826b7c-c248-4242-aaf0-5fd1c63e4ccc`
- Screenshots: `_filter:screenshots` / `b4efee8d-7a7d-4baf-9904-6f3241830f0c`
- Dokumentationen: `_filter:documentation` / `5d15c12a-0e6e-42c6-8a75-d4ab7788f7dc`

Die IDs sind in `mobile/lib/config/filter_albums.dart` zentral abgelegt.

## Semantik

- Person `Alle`: keine Album-Einschraenkung.
- Person `Rachel`: Asset ist im Rachel-Filteralbum.
- Person `Chris`: Asset ist nicht im Rachel-Filteralbum.
- `Nur Fotos`: Asset ist nicht in Dokumente, Screenshots oder Dokumentationen.
- Medientyp: `Alle`, `Bilder`, `Videos` filtert ueber den bestehenden lokalen Asset-Typ.
- Lokale, noch nicht synchronisierte Assets werden ausgeblendet, sobald ein Personfilter aktiv ist.

## Mobile-Dateien

- Drift-Query: `mobile/lib/infrastructure/entities/merged_asset.drift`
- Timeline-Verkabelung: `mobile/lib/infrastructure/repositories/timeline.repository.dart` und `mobile/lib/domain/services/timeline.service.dart`
- Persistente Filter-Settings: `mobile/lib/services/app_settings.service.dart`, `mobile/lib/domain/models/store.model.dart`, `mobile/lib/providers/filter.provider.dart`
- UI Hauptgalerie: `mobile/lib/presentation/pages/dev/main_timeline.page.dart`
- Bibliotheks-Shortcuts: `mobile/lib/presentation/pages/drift_library.page.dart`, `mobile/lib/presentation/pages/filter_album.page.dart`

Die `_filter:*`-Alben bleiben aus normalen Albumlisten ausgeblendet, werden aber fuer Filter und Shortcuts lokal weiter synchronisiert.

## Bugfix-Run 2026-04-26

- Behoben: Die neue Filterleiste wird nur in `PhotosFilterMode.all` angezeigt und angewendet. In alten Album-, Favoriten-, Bilder- und Videos-Ansichten wirken persistierte Person/Medientyp/Nur-Fotos-Werte dadurch nicht mehr unsichtbar weiter.
- Behoben: Der Timeline-Scrubber addiert `topSliverWidgetHeight` und AppBar-Hoehe jetzt korrekt geklammert. Das betrifft die neue Filterleiste, weil sie als Top-Sliver in der Hauptgalerie eingebunden ist.
- Optimiert: Die Hauptgalerie behaelt beim Filterwechsel denselben `TimelineService`; nur die lokale Query wird ersetzt. Neue Buckets werden erst nach geladenem Puffer an die UI gesendet, damit der Vollbild-Spinner beim Umschalten nicht mehr flackert.
- Geprueft: `git diff --check`
- Geprueft: `mise exec -- flutter analyze ...` fuer die betroffenen Filter-/Timeline-Dateien
- Geprueft: `mise exec -- flutter test test/infrastructure/repositories/merged_asset_drift_test.dart`
- Geprueft: `mise exec -- flutter test test/domain/repositories/sync_stream_repository_test.dart test/infrastructure/repositories/sync_api_repository_test.dart test/domain/services/sync_stream_service_test.dart`
