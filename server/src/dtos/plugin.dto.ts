import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { WorkflowTrigger, WorkflowType } from 'src/enum';
import { JSONSchema } from 'src/types';
import { asMethodString } from 'src/utils/workflow';
import { ValidateBoolean, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';

export class PluginSearchDto {
  @ValidateUUID({ optional: true, description: 'Plugin ID' })
  id?: string;

  @ValidateBoolean({ optional: true, description: 'Whether the plugin is enabled' })
  enabled?: boolean;

  @ValidateString({ optional: true })
  name?: string;

  @ValidateString({ optional: true })
  version?: string;

  @ValidateString({ optional: true })
  title?: string;

  @ValidateString({ optional: true })
  description?: string;
}

export class PluginResponseDto {
  @ApiProperty({ description: 'Plugin ID' })
  id!: string;
  @ApiProperty({ description: 'Plugin name' })
  name!: string;
  @ApiProperty({ description: 'Plugin title' })
  title!: string;
  @ApiProperty({ description: 'Plugin description' })
  description!: string;
  @ApiProperty({ description: 'Plugin author' })
  author!: string;
  @ApiProperty({ description: 'Plugin version' })
  version!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: string;
  @ApiProperty({ description: 'Plugin methods' })
  methods!: PluginMethodResponseDto[];
}

export class PluginMethodSearchDto {
  @ValidateUUID({ optional: true, description: 'Plugin method ID' })
  id?: string;

  @ValidateBoolean({ optional: true, description: 'Whether the plugin method is enabled' })
  enabled?: boolean;

  @ValidateString({ optional: true })
  name?: string;

  @ValidateString({ optional: true })
  title?: string;

  @ValidateString({ optional: true })
  description?: string;

  @ValidateEnum({ optional: true, enum: WorkflowType, name: 'WorkflowType' })
  type?: WorkflowType;

  @ValidateEnum({ optional: true, enum: WorkflowTrigger, name: 'WorkflowTrigger' })
  trigger?: WorkflowTrigger;

  @ValidateString({ optional: true })
  pluginName?: string;

  @ValidateString({ optional: true })
  pluginVersion?: string;
}

export class PluginMethodResponseDto {
  @ApiProperty({ description: 'Key' })
  key!: string;

  @ApiProperty({ description: 'Name' })
  name!: string;

  @ApiProperty({ description: 'Title' })
  title!: string;

  @ApiProperty({ description: 'Description' })
  description!: string;

  @ValidateEnum({ name: 'WorkflowType', enum: WorkflowType, each: true, description: 'Workflow types' })
  types!: WorkflowType[];

  @ApiProperty({ description: 'Schema' })
  schema!: JSONSchema | null;
}

export class PluginInstallDto {
  @ApiProperty({ description: 'Path to plugin manifest file' })
  @IsString()
  @IsNotEmpty()
  manifestPath!: string;
}

type Plugin = {
  id: string;
  name: string;
  title: string;
  description: string;
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  methods: PluginMethod[];
};

type PluginMethod = {
  pluginName: string;
  name: string;
  title: string;
  description: string;
  types: WorkflowType[];
  schema: JSONSchema | null;
};

export function mapPlugin(plugin: Plugin): PluginResponseDto {
  return {
    id: plugin.id,
    name: plugin.name,
    title: plugin.title,
    description: plugin.description,
    author: plugin.author,
    version: plugin.version,
    createdAt: plugin.createdAt.toISOString(),
    updatedAt: plugin.updatedAt.toISOString(),
    methods: plugin.methods.map((method) => mapMethod(method)),
  };
}

export const mapMethod = (method: PluginMethod): PluginMethodResponseDto => {
  return {
    key: asMethodString({ pluginName: method.pluginName, methodName: method.name }),
    name: method.name,
    title: method.title,
    description: method.description,
    types: method.types,
    schema: method.schema,
  };
};
