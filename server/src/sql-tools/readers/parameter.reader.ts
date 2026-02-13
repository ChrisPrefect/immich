import { sql } from 'kysely';
import { ParameterScope, Reader } from 'src/sql-tools/types';

export const readParameters: Reader = async (ctx, db) => {
  const parameters = await db
    .selectFrom('pg_settings')
    .where('source', 'in', [sql.lit('database'), sql.lit('user')])
    .select(['name', 'setting as value', 'source as scope'])
    .execute();

  for (const parameter of parameters) {
    ctx.parameters.push({
      name: parameter.name,
      value: parameter.value,
      databaseName: ctx.databaseName,
      scope: parameter.scope as ParameterScope,
      synchronize: true,
    });
  }

  // Read table-scoped storage parameters from pg_class.reloptions
  const tableParams = await db
    .selectFrom('pg_class')
    .innerJoin('pg_namespace', 'pg_namespace.oid', 'pg_class.relnamespace')
    .where('pg_namespace.nspname', '=', ctx.schemaName)
    .where('pg_class.relkind', '=', sql.lit('r'))
    .where('pg_class.reloptions', 'is not', null)
    .select(['pg_class.relname as table_name', 'pg_class.reloptions'])
    .execute();

  for (const row of tableParams) {
    if (!row.reloptions) {
      continue;
    }
    for (const option of row.reloptions) {
      const eqIdx = option.indexOf('=');
      if (eqIdx === -1) {
        continue;
      }
      const name = option.slice(0, eqIdx);
      const value = option.slice(eqIdx + 1);
      ctx.parameters.push({
        name: `${row.table_name}.${name}`,
        tableName: row.table_name,
        value,
        databaseName: ctx.databaseName,
        scope: 'table',
        synchronize: true,
      });
    }
  }
};
