import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE "asset_ocr" ADD "updateId" uuid NOT NULL DEFAULT immich_uuid_v7();`.execute(db);
  await sql`CREATE INDEX "asset_ocr_updateId_idx" ON "asset_ocr" ("updateId");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "asset_ocr_updateId_idx";`.execute(db);
  await sql`ALTER TABLE "asset_ocr" DROP COLUMN "updateId";`.execute(db);
}
