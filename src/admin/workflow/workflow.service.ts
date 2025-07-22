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
import { ParameterMapCategory } from 'src/common/enums/parameter-map-category.enum';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
  ) {}

  private async validateParameterMap(
    parameterMap: Record<string, any>,
    category: ParameterMapCategory,
  ): Promise<Record<string, WorkflowParameterMappingItemDTO>> {
    const validatedMap: Record<string, WorkflowParameterMappingItemDTO> = {};
    const keys = Object.keys(parameterMap);
    const uniqueKeys = new Set(keys);

    if (keys.length !== uniqueKeys.size) {
      throw new BadRequestException('중복된 파라미터 키가 존재합니다.');
    }

    const essentialKeys = PARAMETER_PRESETS.filter((p) =>
      p.essentialForCategories?.includes(category),
    ).map((p) => p.key);

    for (const essentialKey of essentialKeys) {
      if (!parameterMap[essentialKey]) {
        throw new BadRequestException(
          `필수 파라미터 '${essentialKey}'가 누락되었습니다.`,
        );
      }
    }

    for (const key in parameterMap) {
      if (Object.prototype.hasOwnProperty.call(parameterMap, key)) {
        const item = parameterMap[key];

        if (!item.node_id || item.node_id.trim() === '') {
          throw new BadRequestException(
            `'${key}' 파라미터의 'node_id'는 필수입니다.`,
          );
        }
        if (!item.input_name || item.input_name.trim() === '') {
          throw new BadRequestException(
            `'${key}' 파라미터의 'input_name'은 필수입니다.`,
          );
        }

        const itemDTO = plainToInstance(WorkflowParameterMappingItemDTO, item);
        const errors = await validate(itemDTO);
        if (errors.length > 0) {
          throw new BadRequestException(
            `'${key}' 파라미터 유효성 검사 실패: ${errors.toString()}`,
          );
        }
        validatedMap[key] = itemDTO;
      }
    }
    return validatedMap;
  }

  getWorkflowCategories(): string[] {
    return WORKFLOW_CATEGORIES;
  }

  getParameterPresets(category?: ParameterMapCategory): ParameterPreset[] {
    if (!category) return PARAMETER_PRESETS;
    return PARAMETER_PRESETS.filter((preset) =>
      preset.categories.includes(category),
    );
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
    parameterMap: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adminUserId: number,
  ): Promise<Workflow> {
    const existingTemplate = await this.findOneTemplateById(id);
    if (!existingTemplate.category) {
      throw new BadRequestException(
        `템플릿 #${id}에 카테고리가 설정되어 있지 않아 파라미터 맵을 업데이트할 수 없습니다.`,
      );
    }

    const validatedParameterMap = await this.validateParameterMap(
      parameterMap,
      existingTemplate.category,
    );

    existingTemplate.parameter_map = validatedParameterMap;

    return this.workflowRepository.save(existingTemplate);
  }

  async updateTemplate(
    id: number,
    updateDTO: UpdateWorkflowTemplateDTO,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    adminUserId: number,
  ): Promise<Workflow> {
    const existingTemplate = await this.findOneTemplateById(id);

    // 카테고리가 DTO에 포함되어 있고, 기존 값과 다른 경우에만 사용
    const categoryForValidation =
      updateDTO.category || existingTemplate.category;
    if (!categoryForValidation) {
      throw new BadRequestException('템플릿의 카테고리가 지정되지 않았습니다.');
    }

    if (updateDTO.parameter_map) {
      updateDTO.parameter_map = await this.validateParameterMap(
        updateDTO.parameter_map,
        categoryForValidation,
      );
    }

    const updatedTemplate = this.workflowRepository.merge(
      existingTemplate,
      updateDTO,
    );

    return this.workflowRepository.save(updatedTemplate);
  }

  async findAllTemplates(): Promise<Workflow[]> {
    return this.workflowRepository.find({
      where: { isTemplate: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTemplateById(id: number): Promise<Workflow> {
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

  /**
   * 특정 워크플로우 템플릿의 비용을 조회합니다.
   * @param id 워크플로우 템플릿 ID
   * @returns 워크플로우 템플릿의 비용
   */
  async getWorkflowCost(id: number): Promise<number> {
    const template = await this.findOneTemplateById(id);
    return template.cost;
  }

  async removeTemplate(id: number, adminUserId: number): Promise<void> {
    const templateToRemove = await this.findOneTemplateById(id);
    console.log(`Admin #${adminUserId} is removing template #${id}`);
    await this.workflowRepository.remove(templateToRemove);
  }
}
