import {
  AfterDeleteTrigger,
  Column,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { album_user_metadata_audit } from 'src/schema/functions';
import { AlbumTable } from 'src/schema/tables/album.table';
import { UserTable } from 'src/schema/tables/user.table';

@UpdatedAtTrigger('album_user_metadata_updated_at')
@Table('album_user_metadata')
@AfterDeleteTrigger({
  scope: 'statement',
  function: album_user_metadata_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class AlbumUserMetadataTable {
  @ForeignKeyColumn(() => AlbumTable, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    primary: true,
    index: false,
  })
  albumId!: string;

  @ForeignKeyColumn(() => UserTable, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    primary: true,
    index: true,
  })
  userId!: string;

  @Column({ type: 'boolean', default: false })
  isFavorite!: Generated<boolean>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @UpdateDateColumn({ index: true })
  updatedAt!: Generated<Timestamp>;
}
