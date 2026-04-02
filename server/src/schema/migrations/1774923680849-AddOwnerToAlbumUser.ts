import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Backfill: insert album owner into album_user with 'owner' role for all existing albums
  await sql`
    INSERT INTO "album_user" ("albumId", "userId", "role")
    SELECT "id", "ownerId", 'owner' FROM "album"
    ON CONFLICT ("albumId", "userId") DO NOTHING
  `.execute(db);

  // Make album_delete_audit a no-op since the owner is now in album_user
  // and the CASCADE delete will trigger album_user_delete_audit instead
  await sql`
    CREATE OR REPLACE FUNCTION album_delete_audit()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL AS $$
    BEGIN
      RETURN NULL;
    END $$
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore album_delete_audit to insert owner audit entries
  await sql`
    CREATE OR REPLACE FUNCTION album_delete_audit()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL AS $$
    BEGIN
      INSERT INTO album_audit ("albumId", "userId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END $$
  `.execute(db);

  // Remove owner entries from album_user
  await sql`
    DELETE FROM "album_user"
    WHERE ("albumId", "userId") IN (
      SELECT "id", "ownerId" FROM "album"
    )
  `.execute(db);
}
