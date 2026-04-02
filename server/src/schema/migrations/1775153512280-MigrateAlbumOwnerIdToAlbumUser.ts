import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_id_timeline_notDeleted_idx";`.execute(db);
  await sql`DROP INDEX "album_ownerId_idx";`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`ALTER TABLE "album" DROP CONSTRAINT "album_ownerId_fkey";`.execute(db);
  await sql`CREATE INDEX "asset_id_timeline_notDeleted_idx" ON "asset" ("id") WHERE (visibility = 'timeline' AND "deletedAt" IS NULL);`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("personId", "assetId") WHERE ("deletedAt" IS NULL AND "isVisible" IS TRUE);`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"asset_id_timeline_notDeleted_idx","sql":"CREATE INDEX \\"asset_id_timeline_notDeleted_idx\\" ON \\"asset\\" (\\"id\\") WHERE (visibility = ''timeline'' AND \\"deletedAt\\" IS NULL);"}'::jsonb WHERE "name" = 'index_asset_id_timeline_notDeleted_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"asset_ownerId_libraryId_checksum_idx","sql":"CREATE UNIQUE INDEX \\"asset_ownerId_libraryId_checksum_idx\\" ON \\"asset\\" (\\"ownerId\\", \\"libraryId\\", \\"checksum\\") WHERE ((\\"libraryId\\" IS NOT NULL));"}'::jsonb WHERE "name" = 'index_asset_ownerId_libraryId_checksum_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"UQ_assets_owner_checksum","sql":"CREATE UNIQUE INDEX \\"UQ_assets_owner_checksum\\" ON \\"asset\\" (\\"ownerId\\", \\"checksum\\") WHERE ((\\"libraryId\\" IS NULL));"}'::jsonb WHERE "name" = 'index_UQ_assets_owner_checksum';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"activity_like_idx","sql":"CREATE UNIQUE INDEX \\"activity_like_idx\\" ON \\"activity\\" (\\"assetId\\", \\"userId\\", \\"albumId\\") WHERE ((\\"isLiked\\" = true));"}'::jsonb WHERE "name" = 'index_activity_like_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"index","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE (\\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE);"}'::jsonb WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'function_album_delete_audit';`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_album_delete_audit';`.execute(db);
  await sql`ALTER TABLE "album" DROP COLUMN "ownerId";`.execute(db);
  await sql`DROP TRIGGER "album_delete_audit" ON "album";`.execute(db);
  await sql`DROP FUNCTION album_delete_audit;`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.album_delete_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`DROP INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx";`.execute(db);
  await sql`DROP INDEX "asset_id_timeline_notDeleted_idx";`.execute(db);
  await sql`ALTER TABLE "album" ADD "ownerId" uuid NOT NULL;`.execute(db);
  await sql`ALTER TABLE "album" ADD CONSTRAINT "album_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`.execute(db);
  await sql`CREATE INDEX "album_ownerId_idx" ON "album" ("ownerId");`.execute(db);
  await sql`CREATE INDEX "asset_face_personId_assetId_notDeleted_isVisible_idx" ON "asset_face" ("assetId", "personId") WHERE ((("deletedAt" IS NULL) AND ("isVisible" IS TRUE)));`.execute(db);
  await sql`CREATE INDEX "asset_id_timeline_notDeleted_idx" ON "asset" ("id") WHERE (((visibility = 'timeline'::asset_visibility_enum) AND ("deletedAt" IS NULL)));`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "album_delete_audit"
  AFTER DELETE ON "album"
  REFERENCING OLD TABLE AS "old"
  FOR EACH STATEMENT
  WHEN ((pg_trigger_depth() = 0))
  EXECUTE FUNCTION album_delete_audit();`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('function_album_delete_audit', '{"sql":"CREATE OR REPLACE FUNCTION album_delete_audit()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      INSERT INTO album_audit (\\"albumId\\", \\"userId\\")\\n      SELECT \\"id\\", \\"ownerId\\"\\n      FROM OLD;\\n      RETURN NULL;\\n    END\\n  $$;","name":"album_delete_audit","type":"function"}'::jsonb);`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_album_delete_audit', '{"sql":"CREATE OR REPLACE TRIGGER \\"album_delete_audit\\"\\n  AFTER DELETE ON \\"album\\"\\n  REFERENCING OLD TABLE AS \\"old\\"\\n  FOR EACH STATEMENT\\n  WHEN (pg_trigger_depth() = 0)\\n  EXECUTE FUNCTION album_delete_audit();","name":"album_delete_audit","type":"trigger"}'::jsonb);`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE UNIQUE INDEX \\"asset_ownerId_libraryId_checksum_idx\\" ON \\"asset\\" (\\"ownerId\\", \\"libraryId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NOT NULL);","name":"asset_ownerId_libraryId_checksum_idx","type":"index"}'::jsonb WHERE "name" = 'index_asset_ownerId_libraryId_checksum_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE UNIQUE INDEX \\"activity_like_idx\\" ON \\"activity\\" (\\"assetId\\", \\"userId\\", \\"albumId\\") WHERE (\\"isLiked\\" = true);","name":"activity_like_idx","type":"index"}'::jsonb WHERE "name" = 'index_activity_like_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE UNIQUE INDEX \\"UQ_assets_owner_checksum\\" ON \\"asset\\" (\\"ownerId\\", \\"checksum\\") WHERE (\\"libraryId\\" IS NULL);","name":"UQ_assets_owner_checksum","type":"index"}'::jsonb WHERE "name" = 'index_UQ_assets_owner_checksum';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE INDEX \\"asset_id_timeline_notDeleted_idx\\" ON \\"asset\\" (\\"id\\") WHERE visibility = ''timeline'' AND \\"deletedAt\\" IS NULL;","name":"asset_id_timeline_notDeleted_idx","type":"index"}'::jsonb WHERE "name" = 'index_asset_id_timeline_notDeleted_idx';`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE INDEX \\"asset_face_personId_assetId_notDeleted_isVisible_idx\\" ON \\"asset_face\\" (\\"personId\\", \\"assetId\\") WHERE \\"deletedAt\\" IS NULL AND \\"isVisible\\" IS TRUE;","name":"asset_face_personId_assetId_notDeleted_isVisible_idx","type":"index"}'::jsonb WHERE "name" = 'index_asset_face_personId_assetId_notDeleted_isVisible_idx';`.execute(db);
}
