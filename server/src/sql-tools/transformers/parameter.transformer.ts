import { SqlTransformer } from 'src/sql-tools/transformers/types';
import { DatabaseParameter } from 'src/sql-tools/types';

export const transformParameters: SqlTransformer = (ctx, item) => {
  switch (item.type) {
    case 'ParameterSet': {
      return asParameterSet(item.parameter);
    }

    case 'ParameterReset': {
      return asParameterReset(item.databaseName, item.parameterName, item.tableName);
    }

    default: {
      return false;
    }
  }
};

const getParameterName = (parameter: DatabaseParameter): string => {
  if (parameter.scope === 'table' && parameter.tableName && parameter.name.startsWith(`${parameter.tableName}.`)) {
    return parameter.name.slice(parameter.tableName.length + 1);
  }
  return parameter.name;
};

const asParameterSet = (parameter: DatabaseParameter): string => {
  if (parameter.scope === 'table' && parameter.tableName) {
    const paramName = getParameterName(parameter);
    return `ALTER TABLE "${parameter.tableName}" SET (${paramName} = ${parameter.value})`;
  }

  let sql = '';
  if (parameter.scope === 'database') {
    sql += `ALTER DATABASE "${parameter.databaseName}" `;
  }

  sql += `SET ${parameter.name} TO ${parameter.value}`;

  return sql;
};

const asParameterReset = (databaseName: string, parameterName: string, tableName?: string): string => {
  if (tableName) {
    return `ALTER TABLE "${tableName}" RESET (${parameterName})`;
  }
  return `ALTER DATABASE "${databaseName}" RESET "${parameterName}"`;
};
