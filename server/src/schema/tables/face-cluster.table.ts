import {
  AfterDeleteTrigger,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { face_cluster_delete_audit } from 'src/schema/functions';
import { UserTable } from 'src/schema/tables/user.table';

@Table('face_cluster')
@UpdatedAtTrigger('face_cluster_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: face_cluster_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
export class FaceClusterTable {
  @PrimaryGeneratedColumn('uuid')
  id!: Generated<string>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  ownerId!: string;
}
