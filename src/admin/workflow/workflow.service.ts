import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Workflow } from 'src/common/entities/workflow.entity';
import { CreateWorkflowTemplateDTO } from 'src/common/dto/workflow/create-workflow-template.dto';
import { UpdateParameterMapDTO } from 'src/common/dto/workflow/update-parameter-map.dto';
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

  private async validateParameterMap(
    parameterMap: Record<string, WorkflowParameterMappingItemDTO>,
    category: string,
  ) {
    // 1. 카테고리에 따른 필�� 파라미터 검사
    const essentialKeys = PARAMETER_PRESETS
      .filter(p => p.essentialForCategories?.includes(category))
      .map(p => p.key);
    
    for (const essentialKey of essentialKeys) {
      if (!parameterMap[essentialKey]) {
        throw new BadRequestException(`필수 파라미터 '${essentialKey}'가 누락되었습니다.`);
      }
    }

    // 2. 각 파라미터의 세부 유효성 검사
    for (const key in parameterMap) {
      if (Object.prototype.hasOwnProperty.call(parameterMap, key)) {
        const item = parameterMap[key];
        const itemDTO = plainToInstance(WorkflowParameterMappingItemDTO, item);
        const errors = await validate(itemDTO);
        if (errors.length > 0) {
          throw new BadRequestException(`'${key}' 파라미터 유효성 검사 실패: ${errors.toString()}`);
        }
        if (!item.node_id || !item.input_name) {
          throw new BadRequestException(`'${key}' 파라미터의 node_id와 input_name은 필수입니다.`);
        }
        parameterMap[key] = itemDTO;
      }
    }
  }

  getWorkflowCategories(): string[] {
    return WORKFLOW_CATEGORIES;
  }

  getParameterPresets(category?: string): ParameterPreset[] {
    if (!category) return PARAMETER_PRESETS;
    return PARAMETER_PRESETS.filter((preset) => preset.categories.includes(category));
  }

  async createTemplate(
    createDTO: CreateWorkflowTemplateDTO,
    adminUserId: number,
  ): Promise<Workflow> {
    const workflowData: DeepPartial<Workflow> = {
      ...createDTO,
      isTemplate: true,
      ownerUserId: adminUserId,
    };
    const newTemplate = this.workflowRepository.create(workflowData);
    return this.workflowRepository.save(newTemplate);
  }

  async updateParameterMap(
    id: number,
    updateDTO: UpdateParameterMapDTO,
    adminUserId: number,
  ): Promise<Workflow> {
    const existingTemplate = await this.findOneTemplateById(id);
    if (!existingTemplate.category) {
      throw new BadRequestException(`템플릿 #${id}에 카테고리가 설정되어 있지 않아 파라미터 맵을 업데이트할 수 없습니다.`);
    }

    await this.validateParameterMap(updateDTO.parameter_map, existingTemplate.category);

    existingTemplate.parameter_map = updateDTO.parameter_map;
    // 마지막 수정자를 기록하고 싶다면...
    // existingTemplate.lastModifiedBy = adminUserId;
    
    return this.workflowRepository.save(existingTemplate);
  }

  async findAllTemplates(): Promise<Workflow[]> {
    return this.workflowRepository.find({
      where: { isTemplate: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTemplateById(id: number): Promise<Workflow> {
    const template = await this.workflowRepository.findOne({ where: { id, isTemplate: true } });
    if (!template) {
      throw new NotFoundException(`Workflow template with ID #${id} not found.`);
    }
    return template;
  }

  async removeTemplate(id: number, adminUserId: number): Promise<void> {
    const templateToRemove = await this.findOneTemplateById(id);
    console.log(`Admin #${adminUserId} is removing template #${id}`);
    await this.workflowRepository.remove(templateToRemove);
  }
}
