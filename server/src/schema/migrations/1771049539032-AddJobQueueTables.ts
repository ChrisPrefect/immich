import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "jobs_thumbnail_generation" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_thumbnail_generation_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_thumbnail_generation_dedup" ON "jobs_thumbnail_generation" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_thumbnail_generation_pending" ON "jobs_thumbnail_generation" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_metadata_extraction" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_metadata_extraction_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_metadata_extraction_dedup" ON "jobs_metadata_extraction" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_metadata_extraction_pending" ON "jobs_metadata_extraction" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_video_conversion" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_video_conversion_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_video_conversion_dedup" ON "jobs_video_conversion" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_video_conversion_pending" ON "jobs_video_conversion" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_face_detection" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_face_detection_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_face_detection_dedup" ON "jobs_face_detection" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_face_detection_pending" ON "jobs_face_detection" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_facial_recognition" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_facial_recognition_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_facial_recognition_dedup" ON "jobs_facial_recognition" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_facial_recognition_pending" ON "jobs_facial_recognition" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_smart_search" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_smart_search_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_smart_search_dedup" ON "jobs_smart_search" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_smart_search_pending" ON "jobs_smart_search" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_duplicate_detection" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_duplicate_detection_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_duplicate_detection_dedup" ON "jobs_duplicate_detection" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_duplicate_detection_pending" ON "jobs_duplicate_detection" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_background_task" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_background_task_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_background_task_dedup" ON "jobs_background_task" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_background_task_pending" ON "jobs_background_task" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_storage_template_migration" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_storage_template_migration_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_storage_template_migration_dedup" ON "jobs_storage_template_migration" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_storage_template_migration_pending" ON "jobs_storage_template_migration" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_migration" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_migration_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_migration_dedup" ON "jobs_migration" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_migration_pending" ON "jobs_migration" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_search" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_search_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_search_dedup" ON "jobs_search" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_search_pending" ON "jobs_search" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_sidecar" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_sidecar_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_sidecar_dedup" ON "jobs_sidecar" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_sidecar_pending" ON "jobs_sidecar" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_library" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_library_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_library_dedup" ON "jobs_library" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_library_pending" ON "jobs_library" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_notification" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_notification_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_notification_dedup" ON "jobs_notification" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_notification_pending" ON "jobs_notification" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_backup_database" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_backup_database_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_backup_database_dedup" ON "jobs_backup_database" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_backup_database_pending" ON "jobs_backup_database" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_ocr" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_ocr_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_ocr_dedup" ON "jobs_ocr" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_ocr_pending" ON "jobs_ocr" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_workflow" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_workflow_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_workflow_dedup" ON "jobs_workflow" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_workflow_pending" ON "jobs_workflow" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "jobs_editor" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "runAfter" timestamp with time zone NOT NULL DEFAULT now(),
  "startedAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  "code" smallint NOT NULL,
  "priority" smallint NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 0,
  "data" jsonb,
  "dedupKey" text,
  "error" text,
  CONSTRAINT "jobs_editor_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE UNIQUE INDEX "IDX_jobs_editor_dedup" ON "jobs_editor" ("dedupKey") WHERE "dedupKey" IS NOT NULL AND status = 0;`.execute(db);
  await sql`CREATE INDEX "IDX_jobs_editor_pending" ON "jobs_editor" ("priority", "id") WHERE status = 0;`.execute(db);
  await sql`CREATE TABLE "job_queue_meta" (
  "queueName" text NOT NULL,
  "isPaused" boolean NOT NULL DEFAULT false,
  CONSTRAINT "job_queue_meta_pkey" PRIMARY KEY ("queueName")
);`.execute(db);
  await sql`ALTER TABLE "jobs_thumbnail_generation" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_thumbnail_generation" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_thumbnail_generation" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_metadata_extraction" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_metadata_extraction" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_metadata_extraction" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_video_conversion" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_video_conversion" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_video_conversion" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_face_detection" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_face_detection" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_face_detection" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_facial_recognition" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_facial_recognition" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_facial_recognition" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_smart_search" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_smart_search" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_smart_search" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_duplicate_detection" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_duplicate_detection" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_duplicate_detection" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_background_task" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_background_task" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_background_task" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_storage_template_migration" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_storage_template_migration" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_storage_template_migration" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_migration" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_migration" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_migration" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_search" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_search" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_search" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_sidecar" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_sidecar" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_sidecar" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_library" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_library" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_library" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_notification" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_notification" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_notification" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_backup_database" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_backup_database" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_backup_database" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_ocr" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_ocr" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_ocr" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_workflow" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_workflow" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_workflow" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`ALTER TABLE "jobs_editor" SET (autovacuum_vacuum_cost_delay = 0)`.execute(db);
  await sql`ALTER TABLE "jobs_editor" SET (autovacuum_vacuum_scale_factor = 0.01)`.execute(db);
  await sql`ALTER TABLE "jobs_editor" SET (autovacuum_vacuum_threshold = 100)`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_thumbnail_generation_dedup', '{"type":"index","name":"IDX_jobs_thumbnail_generation_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_thumbnail_generation_dedup\\" ON \\"jobs_thumbnail_generation\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_thumbnail_generation_pending', '{"type":"index","name":"IDX_jobs_thumbnail_generation_pending","sql":"CREATE INDEX \\"IDX_jobs_thumbnail_generation_pending\\" ON \\"jobs_thumbnail_generation\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_metadata_extraction_dedup', '{"type":"index","name":"IDX_jobs_metadata_extraction_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_metadata_extraction_dedup\\" ON \\"jobs_metadata_extraction\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_metadata_extraction_pending', '{"type":"index","name":"IDX_jobs_metadata_extraction_pending","sql":"CREATE INDEX \\"IDX_jobs_metadata_extraction_pending\\" ON \\"jobs_metadata_extraction\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_video_conversion_dedup', '{"type":"index","name":"IDX_jobs_video_conversion_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_video_conversion_dedup\\" ON \\"jobs_video_conversion\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_video_conversion_pending', '{"type":"index","name":"IDX_jobs_video_conversion_pending","sql":"CREATE INDEX \\"IDX_jobs_video_conversion_pending\\" ON \\"jobs_video_conversion\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_face_detection_dedup', '{"type":"index","name":"IDX_jobs_face_detection_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_face_detection_dedup\\" ON \\"jobs_face_detection\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_face_detection_pending', '{"type":"index","name":"IDX_jobs_face_detection_pending","sql":"CREATE INDEX \\"IDX_jobs_face_detection_pending\\" ON \\"jobs_face_detection\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_facial_recognition_dedup', '{"type":"index","name":"IDX_jobs_facial_recognition_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_facial_recognition_dedup\\" ON \\"jobs_facial_recognition\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_facial_recognition_pending', '{"type":"index","name":"IDX_jobs_facial_recognition_pending","sql":"CREATE INDEX \\"IDX_jobs_facial_recognition_pending\\" ON \\"jobs_facial_recognition\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_smart_search_dedup', '{"type":"index","name":"IDX_jobs_smart_search_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_smart_search_dedup\\" ON \\"jobs_smart_search\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_smart_search_pending', '{"type":"index","name":"IDX_jobs_smart_search_pending","sql":"CREATE INDEX \\"IDX_jobs_smart_search_pending\\" ON \\"jobs_smart_search\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_duplicate_detection_dedup', '{"type":"index","name":"IDX_jobs_duplicate_detection_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_duplicate_detection_dedup\\" ON \\"jobs_duplicate_detection\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_duplicate_detection_pending', '{"type":"index","name":"IDX_jobs_duplicate_detection_pending","sql":"CREATE INDEX \\"IDX_jobs_duplicate_detection_pending\\" ON \\"jobs_duplicate_detection\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_background_task_dedup', '{"type":"index","name":"IDX_jobs_background_task_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_background_task_dedup\\" ON \\"jobs_background_task\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_background_task_pending', '{"type":"index","name":"IDX_jobs_background_task_pending","sql":"CREATE INDEX \\"IDX_jobs_background_task_pending\\" ON \\"jobs_background_task\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_storage_template_migration_dedup', '{"type":"index","name":"IDX_jobs_storage_template_migration_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_storage_template_migration_dedup\\" ON \\"jobs_storage_template_migration\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_storage_template_migration_pending', '{"type":"index","name":"IDX_jobs_storage_template_migration_pending","sql":"CREATE INDEX \\"IDX_jobs_storage_template_migration_pending\\" ON \\"jobs_storage_template_migration\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_migration_dedup', '{"type":"index","name":"IDX_jobs_migration_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_migration_dedup\\" ON \\"jobs_migration\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_migration_pending', '{"type":"index","name":"IDX_jobs_migration_pending","sql":"CREATE INDEX \\"IDX_jobs_migration_pending\\" ON \\"jobs_migration\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_search_dedup', '{"type":"index","name":"IDX_jobs_search_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_search_dedup\\" ON \\"jobs_search\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_search_pending', '{"type":"index","name":"IDX_jobs_search_pending","sql":"CREATE INDEX \\"IDX_jobs_search_pending\\" ON \\"jobs_search\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_sidecar_dedup', '{"type":"index","name":"IDX_jobs_sidecar_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_sidecar_dedup\\" ON \\"jobs_sidecar\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_sidecar_pending', '{"type":"index","name":"IDX_jobs_sidecar_pending","sql":"CREATE INDEX \\"IDX_jobs_sidecar_pending\\" ON \\"jobs_sidecar\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_library_dedup', '{"type":"index","name":"IDX_jobs_library_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_library_dedup\\" ON \\"jobs_library\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_library_pending', '{"type":"index","name":"IDX_jobs_library_pending","sql":"CREATE INDEX \\"IDX_jobs_library_pending\\" ON \\"jobs_library\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_notification_dedup', '{"type":"index","name":"IDX_jobs_notification_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_notification_dedup\\" ON \\"jobs_notification\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_notification_pending', '{"type":"index","name":"IDX_jobs_notification_pending","sql":"CREATE INDEX \\"IDX_jobs_notification_pending\\" ON \\"jobs_notification\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_backup_database_dedup', '{"type":"index","name":"IDX_jobs_backup_database_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_backup_database_dedup\\" ON \\"jobs_backup_database\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_backup_database_pending', '{"type":"index","name":"IDX_jobs_backup_database_pending","sql":"CREATE INDEX \\"IDX_jobs_backup_database_pending\\" ON \\"jobs_backup_database\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_ocr_dedup', '{"type":"index","name":"IDX_jobs_ocr_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_ocr_dedup\\" ON \\"jobs_ocr\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_ocr_pending', '{"type":"index","name":"IDX_jobs_ocr_pending","sql":"CREATE INDEX \\"IDX_jobs_ocr_pending\\" ON \\"jobs_ocr\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_workflow_dedup', '{"type":"index","name":"IDX_jobs_workflow_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_workflow_dedup\\" ON \\"jobs_workflow\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_workflow_pending', '{"type":"index","name":"IDX_jobs_workflow_pending","sql":"CREATE INDEX \\"IDX_jobs_workflow_pending\\" ON \\"jobs_workflow\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_editor_dedup', '{"type":"index","name":"IDX_jobs_editor_dedup","sql":"CREATE UNIQUE INDEX \\"IDX_jobs_editor_dedup\\" ON \\"jobs_editor\\" (\\"dedupKey\\") WHERE \\"dedupKey\\" IS NOT NULL AND status = 0;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_IDX_jobs_editor_pending', '{"type":"index","name":"IDX_jobs_editor_pending","sql":"CREATE INDEX \\"IDX_jobs_editor_pending\\" ON \\"jobs_editor\\" (\\"priority\\", \\"id\\") WHERE status = 0;"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "jobs_thumbnail_generation" RESET (jobs_thumbnail_generation.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_thumbnail_generation" RESET (jobs_thumbnail_generation.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_thumbnail_generation" RESET (jobs_thumbnail_generation.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_metadata_extraction" RESET (jobs_metadata_extraction.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_metadata_extraction" RESET (jobs_metadata_extraction.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_metadata_extraction" RESET (jobs_metadata_extraction.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_video_conversion" RESET (jobs_video_conversion.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_video_conversion" RESET (jobs_video_conversion.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_video_conversion" RESET (jobs_video_conversion.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_face_detection" RESET (jobs_face_detection.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_face_detection" RESET (jobs_face_detection.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_face_detection" RESET (jobs_face_detection.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_facial_recognition" RESET (jobs_facial_recognition.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_facial_recognition" RESET (jobs_facial_recognition.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_facial_recognition" RESET (jobs_facial_recognition.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_smart_search" RESET (jobs_smart_search.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_smart_search" RESET (jobs_smart_search.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_smart_search" RESET (jobs_smart_search.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_duplicate_detection" RESET (jobs_duplicate_detection.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_duplicate_detection" RESET (jobs_duplicate_detection.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_duplicate_detection" RESET (jobs_duplicate_detection.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_background_task" RESET (jobs_background_task.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_background_task" RESET (jobs_background_task.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_background_task" RESET (jobs_background_task.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_storage_template_migration" RESET (jobs_storage_template_migration.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_storage_template_migration" RESET (jobs_storage_template_migration.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_storage_template_migration" RESET (jobs_storage_template_migration.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_migration" RESET (jobs_migration.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_migration" RESET (jobs_migration.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_migration" RESET (jobs_migration.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_search" RESET (jobs_search.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_search" RESET (jobs_search.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_search" RESET (jobs_search.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_sidecar" RESET (jobs_sidecar.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_sidecar" RESET (jobs_sidecar.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_sidecar" RESET (jobs_sidecar.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_library" RESET (jobs_library.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_library" RESET (jobs_library.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_library" RESET (jobs_library.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_notification" RESET (jobs_notification.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_notification" RESET (jobs_notification.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_notification" RESET (jobs_notification.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_backup_database" RESET (jobs_backup_database.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_backup_database" RESET (jobs_backup_database.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_backup_database" RESET (jobs_backup_database.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_ocr" RESET (jobs_ocr.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_ocr" RESET (jobs_ocr.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_ocr" RESET (jobs_ocr.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_workflow" RESET (jobs_workflow.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_workflow" RESET (jobs_workflow.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_workflow" RESET (jobs_workflow.autovacuum_vacuum_threshold)`.execute(db);
  await sql`ALTER TABLE "jobs_editor" RESET (jobs_editor.autovacuum_vacuum_cost_delay)`.execute(db);
  await sql`ALTER TABLE "jobs_editor" RESET (jobs_editor.autovacuum_vacuum_scale_factor)`.execute(db);
  await sql`ALTER TABLE "jobs_editor" RESET (jobs_editor.autovacuum_vacuum_threshold)`.execute(db);
  await sql`DROP TABLE "jobs_thumbnail_generation";`.execute(db);
  await sql`DROP TABLE "jobs_metadata_extraction";`.execute(db);
  await sql`DROP TABLE "jobs_video_conversion";`.execute(db);
  await sql`DROP TABLE "jobs_face_detection";`.execute(db);
  await sql`DROP TABLE "jobs_facial_recognition";`.execute(db);
  await sql`DROP TABLE "jobs_smart_search";`.execute(db);
  await sql`DROP TABLE "jobs_duplicate_detection";`.execute(db);
  await sql`DROP TABLE "jobs_background_task";`.execute(db);
  await sql`DROP TABLE "jobs_storage_template_migration";`.execute(db);
  await sql`DROP TABLE "jobs_migration";`.execute(db);
  await sql`DROP TABLE "jobs_search";`.execute(db);
  await sql`DROP TABLE "jobs_sidecar";`.execute(db);
  await sql`DROP TABLE "jobs_library";`.execute(db);
  await sql`DROP TABLE "jobs_notification";`.execute(db);
  await sql`DROP TABLE "jobs_backup_database";`.execute(db);
  await sql`DROP TABLE "jobs_ocr";`.execute(db);
  await sql`DROP TABLE "jobs_workflow";`.execute(db);
  await sql`DROP TABLE "jobs_editor";`.execute(db);
  await sql`DROP TABLE "job_queue_meta";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_thumbnail_generation_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_thumbnail_generation_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_metadata_extraction_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_metadata_extraction_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_video_conversion_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_video_conversion_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_face_detection_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_face_detection_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_facial_recognition_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_facial_recognition_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_smart_search_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_smart_search_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_duplicate_detection_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_duplicate_detection_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_background_task_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_background_task_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_storage_template_migration_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_storage_template_migration_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_migration_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_migration_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_search_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_search_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_sidecar_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_sidecar_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_library_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_library_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_notification_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_notification_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_backup_database_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_backup_database_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_ocr_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_ocr_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_workflow_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_workflow_pending';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_editor_dedup';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_IDX_jobs_editor_pending';`.execute(db);
}
