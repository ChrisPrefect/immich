import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION album_user_after_insert()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS $$
    BEGIN
      UPDATE album SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT "albumId" FROM inserted_rows)
        AND NOT EXISTS (SELECT FROM inserted_rows WHERE role = 'owner');
      RETURN NULL;
    END
  $$;`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"type":"function","name":"album_user_after_insert","sql":"CREATE OR REPLACE FUNCTION album_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE album SET \\"updatedAt\\" = clock_timestamp(), \\"updateId\\" = immich_uuid_v7(clock_timestamp())\\n      WHERE \\"id\\" IN (SELECT \\"albumId\\" FROM inserted_rows)\\n        AND NOT EXISTS (SELECT FROM inserted_rows WHERE role = ''owner'');\\n      RETURN NULL;\\n    END\\n  $$;"}'::jsonb WHERE "name" = 'function_album_user_after_insert';`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`CREATE OR REPLACE FUNCTION public.album_user_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      UPDATE album SET "updatedAt" = clock_timestamp(), "updateId" = immich_uuid_v7(clock_timestamp())
      WHERE "id" IN (SELECT DISTINCT "albumId" FROM inserted_rows)
        AND NOT EXISTS (SELECT FROM inserted_rows WHERE role = 'owner');
      RETURN NULL;
    END
  $function$
`.execute(db);
  await sql`UPDATE "migration_overrides" SET "value" = '{"sql":"CREATE OR REPLACE FUNCTION album_user_after_insert()\\n  RETURNS TRIGGER\\n  LANGUAGE PLPGSQL\\n  AS $$\\n    BEGIN\\n      UPDATE album SET \\"updatedAt\\" = clock_timestamp(), \\"updateId\\" = immich_uuid_v7(clock_timestamp())\\n      WHERE \\"id\\" IN (SELECT DISTINCT \\"albumId\\" FROM inserted_rows)\\n        AND NOT EXISTS (SELECT FROM inserted_rows WHERE role = ''owner'');\\n      RETURN NULL;\\n    END\\n  $$;","name":"album_user_after_insert","type":"function"}'::jsonb WHERE "name" = 'function_album_user_after_insert';`.execute(db);
}
