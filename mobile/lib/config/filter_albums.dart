class FilterAlbums {
  const FilterAlbums._();

  static const rachel = '076697f9-02b8-4d3c-82b4-f3dd091c455e';
  static const documents = 'ee826b7c-c248-4242-aaf0-5fd1c63e4ccc';
  static const screenshots = 'b4efee8d-7a7d-4baf-9904-6f3241830f0c';
  static const documentation = '5d15c12a-0e6e-42c6-8a75-d4ab7788f7dc';

  static const hiddenNames = {'_filter:rachel', '_filter:documents', '_filter:screenshots', '_filter:documentation'};

  static bool isFilterAlbumName(String name) => hiddenNames.contains(name.trim().toLowerCase());
}
