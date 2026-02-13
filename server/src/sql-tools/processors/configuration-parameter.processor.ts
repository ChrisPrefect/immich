import { fromColumnValue } from 'src/sql-tools/helpers';
import { Processor } from 'src/sql-tools/types';

export const processConfigurationParameters: Processor = (ctx, items) => {
  for (const {
    item: { object, options },
  } of items.filter((item) => item.type === 'configurationParameter')) {
    let tableName: string | undefined;
    if (options.scope === 'table') {
      const table = ctx.getTableByObject(object);
      if (!table) {
        ctx.warn('@ConfigurationParameter', `Unable to find table for table-scoped parameter "${options.name}"`);
        continue;
      }
      tableName = table.name;
    }

    ctx.parameters.push({
      databaseName: ctx.databaseName,
      tableName,
      name: tableName ? `${tableName}.${options.name}` : options.name,
      value: fromColumnValue(options.value),
      scope: options.scope,
      synchronize: options.synchronize ?? true,
    });
  }
};
