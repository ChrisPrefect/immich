import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE UNIQUE INDEX "album_user_unique_owner" ON "album_user" ("albumId") WHERE ((role = 'owner'));`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('index_album_user_unique_owner', '{"type":"index","name":"album_user_unique_owner","sql":"CREATE UNIQUE INDEX \\"album_user_unique_owner\\" ON \\"album_user\\" (\\"albumId\\") WHERE ((role = ''owner''));"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX "album_user_unique_owner";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'index_album_user_unique_owner';`.execute(db);
}
