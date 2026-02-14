import { JobCode, JobQueueStatus } from 'src/enum';
import { Column, ConfigurationParameter, Generated, Index, PrimaryColumn, Table } from 'src/sql-tools';

export type JobTable = {
  id: Generated<number>;
  runAfter: Generated<Date>;
  startedAt: Date | null;
  expiresAt: Date | null;
  code: JobCode;
  priority: Generated<number>;
  status: Generated<JobQueueStatus>;
  data: unknown;
  dedupKey: string | null;
  error: string | null;
};

function defineJobTable(name: string) {
  class JobTable {
    @PrimaryColumn({ type: 'bigint', identity: true })
    id!: Generated<number>;

    @Column({ type: 'timestamp with time zone', default: () => 'now()' })
    runAfter!: Generated<Date>;

    @Column({ type: 'timestamp with time zone', nullable: true })
    startedAt!: Date | null;

    @Column({ type: 'timestamp with time zone', nullable: true })
    expiresAt!: Date | null;

    @Column({ type: 'smallint' })
    code!: JobCode;

    @Column({ type: 'smallint', default: 0 })
    priority!: Generated<number>;

    @Column({ type: 'smallint', default: 0 })
    status!: Generated<JobQueueStatus>;

    @Column({ type: 'jsonb', nullable: true })
    data!: unknown;

    @Column({ type: 'text', nullable: true })
    dedupKey!: string | null;

    @Column({ type: 'text', nullable: true })
    error!: string | null;
  }

  const decorated = [
    ConfigurationParameter({ name: 'autovacuum_vacuum_cost_delay', value: 0, scope: 'table' }),
    ConfigurationParameter({ name: 'autovacuum_vacuum_scale_factor', value: 0.01, scope: 'table' }),
    ConfigurationParameter({ name: 'autovacuum_vacuum_threshold', value: 100, scope: 'table' }),
    Index({
      name: `IDX_${name}_dedup`,
      columns: ['dedupKey'],
      unique: true,
      where: `"dedupKey" IS NOT NULL AND status = 0`,
    }),
    Index({ name: `IDX_${name}_pending`, columns: ['priority', 'id'], where: 'status = 0' }),
    Table(name),
  ].reduce((cls, dec) => dec(cls) || cls, JobTable);
  Object.defineProperty(decorated, 'name', { value: name });
  return decorated;
}

export const JobsThumbnailGenerationTable = defineJobTable('jobs_thumbnail_generation');
export const JobsMetadataExtractionTable = defineJobTable('jobs_metadata_extraction');
export const JobsVideoConversionTable = defineJobTable('jobs_video_conversion');
export const JobsFaceDetectionTable = defineJobTable('jobs_face_detection');
export const JobsFacialRecognitionTable = defineJobTable('jobs_facial_recognition');
export const JobsSmartSearchTable = defineJobTable('jobs_smart_search');
export const JobsDuplicateDetectionTable = defineJobTable('jobs_duplicate_detection');
export const JobsBackgroundTaskTable = defineJobTable('jobs_background_task');
export const JobsStorageTemplateMigrationTable = defineJobTable('jobs_storage_template_migration');
export const JobsMigrationTable = defineJobTable('jobs_migration');
export const JobsSearchTable = defineJobTable('jobs_search');
export const JobsSidecarTable = defineJobTable('jobs_sidecar');
export const JobsLibraryTable = defineJobTable('jobs_library');
export const JobsNotificationTable = defineJobTable('jobs_notification');
export const JobsBackupDatabaseTable = defineJobTable('jobs_backup_database');
export const JobsOcrTable = defineJobTable('jobs_ocr');
export const JobsWorkflowTable = defineJobTable('jobs_workflow');
export const JobsEditorTable = defineJobTable('jobs_editor');

export type JobsThumbnailGenerationTable = InstanceType<typeof JobsThumbnailGenerationTable>;
export type JobsMetadataExtractionTable = InstanceType<typeof JobsMetadataExtractionTable>;
export type JobsVideoConversionTable = InstanceType<typeof JobsVideoConversionTable>;
export type JobsFaceDetectionTable = InstanceType<typeof JobsFaceDetectionTable>;
export type JobsFacialRecognitionTable = InstanceType<typeof JobsFacialRecognitionTable>;
export type JobsSmartSearchTable = InstanceType<typeof JobsSmartSearchTable>;
export type JobsDuplicateDetectionTable = InstanceType<typeof JobsDuplicateDetectionTable>;
export type JobsBackgroundTaskTable = InstanceType<typeof JobsBackgroundTaskTable>;
export type JobsStorageTemplateMigrationTable = InstanceType<typeof JobsStorageTemplateMigrationTable>;
export type JobsMigrationTable = InstanceType<typeof JobsMigrationTable>;
export type JobsSearchTable = InstanceType<typeof JobsSearchTable>;
export type JobsSidecarTable = InstanceType<typeof JobsSidecarTable>;
export type JobsLibraryTable = InstanceType<typeof JobsLibraryTable>;
export type JobsNotificationTable = InstanceType<typeof JobsNotificationTable>;
export type JobsBackupDatabaseTable = InstanceType<typeof JobsBackupDatabaseTable>;
export type JobsOcrTable = InstanceType<typeof JobsOcrTable>;
export type JobsWorkflowTable = InstanceType<typeof JobsWorkflowTable>;
export type JobsEditorTable = InstanceType<typeof JobsEditorTable>;

// Queue metadata table
@Table('job_queue_meta')
export class JobQueueMetaTable {
  @PrimaryColumn({ type: 'text' })
  queueName!: string;

  @Column({ type: 'boolean', default: false })
  isPaused!: Generated<boolean>;
}
