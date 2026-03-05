import type { WorkflowStepConfig } from '@immich/plugin-sdk';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { WorkflowTrigger, WorkflowType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';

export class WorkflowTriggerResponseDto {
  @ValidateEnum({ enum: WorkflowTrigger, name: 'WorkflowTrigger', description: 'Trigger type' })
  trigger!: WorkflowTrigger;
  @ValidateEnum({ enum: WorkflowType, name: 'WorkflowType', description: 'Workflow types', each: true })
  types!: WorkflowType[];
}

export class WorkflowSearchDto {
  @ValidateUUID({ optional: true, description: 'Workflow ID' })
  id?: string;

  @ValidateEnum({
    optional: true,
    enum: WorkflowTrigger,
    name: 'WorkflowTrigger',
    description: 'Workflow trigger type',
  })
  trigger?: WorkflowTrigger;

  @ValidateString({ optional: true, description: 'Workflow name' })
  name?: string;

  @ValidateString({ optional: true, description: 'Workflow description' })
  description?: string;

  @ValidateBoolean({ optional: true, description: 'Workflow enabled' })
  enabled?: boolean;
}

class WorkflowBase {
  @ValidateString({ optional: true, nullable: true, description: 'Workflow name' })
  name?: string | null;

  @ValidateString({ optional: true, nullable: true, description: 'Workflow description' })
  description?: string | null;

  @ValidateBoolean({ optional: true, description: 'Workflow enabled' })
  enabled?: boolean;

  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  @Optional()
  steps?: WorkflowStepDto[];
}

export class WorkflowCreateDto extends WorkflowBase {
  @ValidateEnum({ enum: WorkflowTrigger, name: 'WorkflowTrigger', description: 'Workflow trigger type' })
  trigger!: WorkflowTrigger;
}

export class WorkflowUpdateDto extends WorkflowBase {
  @ValidateEnum({
    enum: WorkflowTrigger,
    name: 'WorkflowTrigger',
    optional: true,
    description: 'Workflow trigger type',
  })
  trigger?: WorkflowTrigger;
}

class WorkflowResponseBase {
  @ValidateEnum({ enum: WorkflowTrigger, name: 'WorkflowTrigger', description: 'Workflow trigger type' })
  trigger!: WorkflowTrigger;

  @ApiProperty({ description: 'Workflow name' })
  name!: string | null;

  @ApiProperty({ description: 'Workflow description' })
  description!: string | null;
}

export class WorkflowResponseDto extends WorkflowResponseBase {
  @ApiProperty({ description: 'Workflow ID' })
  id!: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;

  @ApiProperty({ description: 'Update date' })
  updatedAt!: string;

  @ApiProperty({ description: 'Workflow enabled' })
  enabled!: boolean;

  @ApiProperty({ description: 'Workflow steps' })
  steps!: WorkflowStepDto[];
}
class WorkflowStepBase {
  @ValidateString({ description: 'Step plugin method' })
  method!: string;

  @ApiPropertyOptional({ description: 'Step configuration' })
  @IsObject()
  @Optional({ nullable: true })
  config!: WorkflowStepConfig | null;
}

class WorkflowStepDto extends WorkflowStepBase {
  @ValidateBoolean({ optional: true, description: 'Step is enabled' })
  enabled!: boolean;
}

class WorkflowShareStepDto extends WorkflowStepBase {
  @ValidateBoolean({ optional: true, description: 'Step is enabled' })
  enabled?: boolean;
}

export class WorkflowShareResponseDto extends WorkflowResponseBase {
  @ApiProperty({ description: 'Workflow enabled' })
  enabled?: boolean;

  @ApiProperty({ description: 'Workflow steps' })
  steps!: WorkflowShareStepDto[];
}

type Workflow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  trigger: WorkflowTrigger;
  name: string | null;
  description: string | null;
  enabled: boolean;
};

type WorkflowStep = {
  enabled: boolean;
  methodName: string;
  config: WorkflowStepConfig | null;
  pluginName: string;
};

export const mapWorkflow = (workflow: Workflow & { steps: WorkflowStep[] }): WorkflowResponseDto => {
  return {
    id: workflow.id,
    enabled: workflow.enabled,
    trigger: workflow.trigger,
    name: workflow.name,
    description: workflow.description,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
    steps: workflow.steps.map((step) => ({
      method: `${step.pluginName}#${step.methodName}`,
      config: step.config,
      enabled: step.enabled,
    })),
  };
};

export const mapWorkflowShare = (workflow: Workflow & { steps: WorkflowStep[] }): WorkflowShareResponseDto => {
  return {
    enabled: workflow.enabled ? undefined : false,
    trigger: workflow.trigger,
    name: workflow.name,
    description: workflow.description,
    steps: workflow.steps.map((step) => ({
      method: `${step.pluginName}#${step.methodName}`,
      config: step.config,
      enabled: step.enabled ? undefined : false,
    })),
  };
};
