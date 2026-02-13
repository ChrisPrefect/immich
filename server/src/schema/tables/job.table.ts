import { Column, ConfigurationParameter, Generated, Index, PrimaryColumn, Table } from 'src/sql-tools';

// Job status values stored as "char" (single-byte PostgreSQL type):
// 'p' = pending, 'a' = active, 'c' = completed, 'f' = failed

@Table('jobs_thumbnail_generation')
@Index({ name: 'IDX_jobs_thumbnail_generation_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_thumbnail_generation_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsThumbnailGenerationTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_metadata_extraction')
@Index({ name: 'IDX_jobs_metadata_extraction_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_metadata_extraction_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsMetadataExtractionTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_video_conversion')
@Index({ name: 'IDX_jobs_video_conversion_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_video_conversion_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsVideoConversionTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_face_detection')
@Index({ name: 'IDX_jobs_face_detection_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_face_detection_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsFaceDetectionTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_facial_recognition')
@Index({
  name: 'IDX_jobs_facial_recognition_pending',
  columns: ['priority', 'id'],
  where: `"status" = 'p'::"char"`,
})
@Index({
  name: 'IDX_jobs_facial_recognition_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsFacialRecognitionTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_smart_search')
@Index({ name: 'IDX_jobs_smart_search_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_smart_search_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsSmartSearchTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_duplicate_detection')
@Index({
  name: 'IDX_jobs_duplicate_detection_pending',
  columns: ['priority', 'id'],
  where: `"status" = 'p'::"char"`,
})
@Index({
  name: 'IDX_jobs_duplicate_detection_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsDuplicateDetectionTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_background_task')
@Index({ name: 'IDX_jobs_background_task_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_background_task_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsBackgroundTaskTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_storage_template_migration')
@Index({
  name: 'IDX_jobs_storage_template_migration_pending',
  columns: ['priority', 'id'],
  where: `"status" = 'p'::"char"`,
})
@Index({
  name: 'IDX_jobs_storage_template_migration_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsStorageTemplateMigrationTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_migration')
@Index({ name: 'IDX_jobs_migration_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_migration_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsMigrationTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_search')
@Index({ name: 'IDX_jobs_search_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_search_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsSearchTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_sidecar')
@Index({ name: 'IDX_jobs_sidecar_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_sidecar_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsSidecarTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_library')
@Index({ name: 'IDX_jobs_library_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_library_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsLibraryTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_notification')
@Index({ name: 'IDX_jobs_notification_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_notification_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsNotificationTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_backup_database')
@Index({ name: 'IDX_jobs_backup_database_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_backup_database_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsBackupDatabaseTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_ocr')
@Index({ name: 'IDX_jobs_ocr_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_ocr_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsOcrTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_workflow')
@Index({ name: 'IDX_jobs_workflow_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_workflow_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsWorkflowTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

@Table('jobs_editor')
@Index({ name: 'IDX_jobs_editor_pending', columns: ['priority', 'id'], where: `"status" = 'p'::"char"` })
@Index({
  name: 'IDX_jobs_editor_dedup',
  columns: ['dedup_key'],
  unique: true,
  where: `"dedup_key" IS NOT NULL AND "status" = 'p'::"char"`,
})
@ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' })
@ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' })
export class JobsEditorTable {
  @PrimaryColumn({ type: 'bigint', identity: true })
  id!: Generated<number>;

  @Column({ type: '"char"' })
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: unknown;

  @Column({ type: 'smallint', default: 0 })
  priority!: Generated<number>;

  @Column({ type: '"char"', default: 'p' })
  status!: Generated<string>;

  @Column({ type: 'text', nullable: true })
  dedup_key!: string | null;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  run_after!: Generated<Date>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}

// Queue metadata table
@Table('job_queue_meta')
export class JobQueueMetaTable {
  @PrimaryColumn({ type: 'text' })
  queue_name!: string;

  @Column({ type: 'boolean', default: false })
  is_paused!: Generated<boolean>;
}
