import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_user_metadata_audit()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      INSERT INTO album_user_metadata_audit ("albumId", "userId")
      SELECT "albumId", "userId"
      FROM OLD;
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`CREATE TABLE "album_user_metadata_audit" (
  "id" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "albumId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "deletedAt" timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT "album_user_metadata_audit_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "album_user_metadata_audit_albumId_idx" ON "album_user_metadata_audit" ("albumId");`.execute(db);
  await sql`CREATE INDEX "album_user_metadata_audit_userId_idx" ON "album_user_metadata_audit" ("userId");`.execute(db);
  await sql`CREATE INDEX "album_user_metadata_audit_deletedAt_idx" ON "album_user_metadata_audit" ("deletedAt");`.execute(db);
  await sql`CREATE TABLE "album_user_metadata" (
  "albumId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "isFavorite" boolean NOT NULL DEFAULT false,
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "album_user_metadata_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "album" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "album_user_metadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "album_user_metadata_pkey" PRIMARY KEY ("albumId", "userId")
);`.execute(db);
  await sql`CREATE INDEX "album_user_metadata_userId_idx" ON "album_user_metadata" ("userId");`.execute(db);
  await sql`CREATE INDEX "album_user_metadata_updateId_idx" ON "album_user_metadata" ("updateId");`.execute(db);
  await sql`CREATE INDEX "album_user_metadata_updatedAt_idx" ON "album_user_metadata" ("updatedAt");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_user_metadata_audit"
  AFTER DELETE ON "album_user_metadata"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION album_user_metadata_audit();`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_user_metadata_updated_at"
  BEFORE UPDATE ON "album_user_metadata"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`INSERT INTO "album_user_metadata" ("albumId", "userId", "isFavorite")
  SELECT "id", "ownerId", false FROM "album"
  ON CONFLICT ("albumId", "userId") DO NOTHING;`.execute(db);
  await sql`INSERT INTO "album_user_metadata" ("albumId", "userId", "isFavorite")
  SELECT "albumId", "userId", false FROM "album_user"
  ON CONFLICT ("albumId", "userId") DO NOTHING;`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_user_metadata_audit', '{"type":"function","name":"album_user_metadata_audit","sql":"CREATE OR REPLACE FUNCTION album_user_metadata_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_user_metadata_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"albumId\\", \\"userId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_user_metadata_audit', '{"type":"trigger","name":"album_user_metadata_audit","sql":"CREATE OR REPLACE TRIGGER \\"album_user_metadata_audit\\"\\n  AFTER DELETE ON \\"album_user_metadata\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION album_user_metadata_audit();"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_user_metadata_updated_at', '{"type":"trigger","name":"album_user_metadata_updated_at","sql":"CREATE OR REPLACE TRIGGER \\"album_user_metadata_updated_at\\"\\n  BEFORE UPDATE ON \\"album_user_metadata\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "album_user_metadata_audit";`.execute(db);
  await sql`DROP TABLE "album_user_metadata";`.execute(db);
  await sql`DROP FUNCTION album_user_metadata_audit;`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_user_metadata_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_user_metadata_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_user_metadata_updated_at';`.execute(db);
}
