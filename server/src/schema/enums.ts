import { registerEnum } from '@immich/sql-tools';
import { AssetStatus, AssetVisibility, ChecksumAlgorithm, SharingPermission, SourceType } from 'src/enum';

export const assets_status_enum = registerEnum({
  name: 'assets_status_enum',
  values: Object.values(AssetStatus),
});

export const asset_face_source_type = registerEnum({
  name: 'sourcetype',
  values: Object.values(SourceType),
});

export const asset_visibility_enum = registerEnum({
  name: 'asset_visibility_enum',
  values: Object.values(AssetVisibility),
});

export const asset_checksum_algorithm_enum = registerEnum({
  name: 'asset_checksum_algorithm_enum',
  values: Object.values(ChecksumAlgorithm),
});

export const sharing_permission_enum = registerEnum({
  name: 'sharing_permission_enum',
  values: Object.values(SharingPermission),
});
