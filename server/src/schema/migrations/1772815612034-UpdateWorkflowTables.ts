import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // take #2...
  await sql`DROP TABLE "workflow_action";`.execute(db);
  await sql`DROP TABLE "workflow_filter";`.execute(db);
  await sql`DROP TABLE "workflow";`.execute(db);
  await sql`DROP TABLE "plugin_action";`.execute(db);
  await sql`DROP TABLE "plugin_filter";`.execute(db);
  await sql`DROP TABLE "plugin";`.execute(db);
}

export async function down(): Promise<void> {
  // unsupported
}
