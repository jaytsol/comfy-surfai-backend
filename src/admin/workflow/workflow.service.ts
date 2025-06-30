import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Workflow } from 'src/common/entities/workflow.entity';
import { CreateWorkflowTemplateDTO } from 'src/common/dto/workflow/create-workflow-template.dto';
import { UpdateWorkflowTemplateDTO } from 'src/common/dto/workflow/update-workflow-template.dto';
import { plainToInstance } from 'class-transformer';
import { WorkflowParameterMappingItemDTO } from 'src/common/dto/workflow/workflow-parameter-mapping-item.dto';
import { validate } from 'class-validator';
import {
  ParameterPreset,
  PARAMETER_PRESETS,
  WORKFLOW_CATEGORIES,
} from 'src/common/constants/parameter-presets';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
  ) {}

  /**
   * parameter_map의 유효성을 검사합니다.
   * - 각 항목의 DTO 유효성 검사
   * - node_id 및 input_name의 존재 여부 검사
   * @param parameterMap 검사할 파라미터 맵
   */
  private async validateParameterMap(
    parameterMap: Record<string, WorkflowParameterMappingItemDTO>,
  ) {
    for (const key in parameterMap) {
      if (Object.prototype.hasOwnProperty.call(parameterMap, key)) {
        const item = parameterMap[key];

        // 1. DTO 유효성 검사 (class-validator)
        const itemDTO = plainToInstance(WorkflowParameterMappingItemDTO, item);
        const errors = await validate(itemDTO);
        if (errors.length > 0) {
          throw new BadRequestException(
            `Parameter map validation failed for key "${key}": ${errors.toString()}`,
          );
        }
        
        // 2. node_id 및 input_name 존재 여부 검사
        if (!item.node_id || item.node_id.trim() === '') {
            throw new BadRequestException(`'${key}' 파라미터의 'node_id'는 필수입니다.`);
        }
        if (!item.input_name || item.input_name.trim() === '') {
            throw new BadRequestException(`'${key}' 파라미터의 'input_name'은 필수입니다.`);
        }

        parameterMap[key] = itemDTO; // 검증된 DTO로 교체
      }
    }
  }

  getWorkflowCategories(): string[] {
    return WORKFLOW_CATEGORIES;
  }

  getParameterPresets(category?: string): ParameterPreset[] {
    if (!category) {
      return PARAMETER_PRESETS;
    }
    return PARAMETER_PRESETS.filter((preset) =>
      preset.categories.includes(category),
    );
  }

  async createTemplate(
    createDTO: CreateWorkflowTemplateDTO,
    adminUserId: number,
  ): Promise<Workflow> {
    console.log(
      `[WorkflowService] Admin #${adminUserId} is creating a new template: ${createDTO.name}`,
    );

    if (createDTO.parameter_map) {
      await this.validateParameterMap(createDTO.parameter_map);
    }

    const workflowData: DeepPartial<Workflow> = {
      ...createDTO,
      isTemplate: true,
      ownerUserId: adminUserId,
      sourceTemplateId: undefined,
      user_parameter_values: undefined,
    };
    const newTemplate = this.workflowRepository.create(workflowData);
    return this.workflowRepository.save(newTemplate);
  }

  async findAllTemplates(): Promise<Workflow[]> {
    console.log('[WorkflowService] Finding all templates.');
    return this.workflowRepository.find({
      where: { isTemplate: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTemplateById(id: number): Promise<Workflow> {
    console.log(`[WorkflowService] Finding template with ID #${id}.`);
    const template = await this.workflowRepository.findOne({
      where: { id, isTemplate: true },
    });
    if (!template) {
      throw new NotFoundException(
        `Workflow template with ID #${id} not found.`,
      );
    }
    return template;
  }

  async updateTemplate(
    id: number,
    updateDTO: UpdateWorkflowTemplateDTO,
    adminUserId: number,
  ): Promise<Workflow> {
    const existingTemplate = await this.findOneTemplateById(id);
    console.log(
      `[WorkflowService] Admin #${adminUserId} is updating template #${id}.`,
    );

    if (updateDTO.parameter_map) {
      await this.validateParameterMap(updateDTO.parameter_map);
    }

    const updatedTemplate = this.workflowRepository.merge(
      existingTemplate,
      updateDTO,
    );

    return this.workflowRepository.save(updatedTemplate);
  }

  async removeTemplate(id: number, adminUserId: number): Promise<void> {
    const templateToRemove = await this.findOneTemplateById(id);
    console.log(
      `[WorkflowService] Admin #${adminUserId} is removing template #${id} named "${templateToRemove.name}".`,
    );
    await this.workflowRepository.remove(templateToRemove);
  }
}