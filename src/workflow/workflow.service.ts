import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Workflow } from 'src/common/entities/workflow.entity'; // 사용자님의 경로에 맞게 수정되었는지 확인
import { CreateWorkflowTemplateDTO } from 'src/common/dto/workflow/create-workflow-template.dto'; // 사용자님의 경로에 맞게 수정되었는지 확인
import { UpdateWorkflowTemplateDTO } from 'src/common/dto/workflow/update-workflow-template.dto';
import { plainToInstance } from 'class-transformer';
import { WorkflowParameterMappingItemDto } from 'src/common/dto/workflow/workflow-parameter-mapping-item.dto';
import { validate } from 'class-validator';
// import { ListWorkflowTemplatesQueryDTO } from '../common/dto/workflow/list-workflow-templates-query.dto'; // 향후 페이지네이션/필터링용

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
  ) {}

  /**
   * 새로운 워크플로우 템플릿을 생성합니다. (Admin 전용)
   * @param createDTO 템플릿 생성 정보 dto
   * @param adminUserId 템플릿을 생성하는 관리자의 ID
   * @returns 생성된 Workflow 엔티티
   */
  async createTemplate(
    createDTO: CreateWorkflowTemplateDTO,
    adminUserId: number,
  ): Promise<Workflow> {
    console.log(
      `[WorkflowService] Admin #${adminUserId} is creating a new template: ${createDTO.name}`,
    );
    if (createDTO.parameter_map) {
      for (const key in createDTO.parameter_map) {
        if (
          Object.prototype.hasOwnProperty.call(createDTO.parameter_map, key)
        ) {
          const item = createDTO.parameter_map[key];
          // plainToInstance를 사용하여 일반 객체를 dto 클래스 인스턴스로 변환
          const itemDTO = plainToInstance(
            WorkflowParameterMappingItemDto,
            item,
          );
          const errors = await validate(itemDTO);
          if (errors.length > 0) {
            // 실제로는 더 상세한 에러 메시지 조합 필요
            throw new BadRequestException(
              `Parameter map validation failed for key "${key}": ${errors.toString()}`,
            );
          }
          // 검증된 DTO로 다시 할당 (타입 변환 등이 적용되었을 수 있음)
          createDTO.parameter_map[key] = itemDTO;
        }
      }
    }
    const workflowData: DeepPartial<Workflow> = {
      name: createDTO.name,
      description: createDTO.description,
      definition: createDTO.definition,
      parameter_map: createDTO.parameter_map,
      previewImageUrl: createDTO.previewImageUrl,
      tags: createDTO.tags,
      isPublicTemplate: createDTO.isPublicTemplate ?? false,
      isTemplate: true, // 명시적으로 템플릿임을 표시
      ownerUserId: adminUserId, // 생성한 관리자 ID 설정
      sourceTemplateId: undefined, // 템플릿은 원본이 없음
      user_parameter_values: undefined, // 템플릿 자체에는 사용자 정의 파라미터 값이 없음
    };
    const newTemplate = this.workflowRepository.create(workflowData);
    return this.workflowRepository.save(newTemplate);
  }

  /**
   * 모든 워크플로우 템플릿 목록을 조회합니다. (Admin 전용)
   * 향후 queryDTO를 통해 페이지네이션, 필터링, 정렬 기능 추가 가능
   * @returns Workflow 엔티티 배열
   */
  async findAllTemplates() /* queryDTO?: ListWorkflowTemplatesQueryDTO */
  : Promise<Workflow[]> {
    console.log('[WorkflowService] Finding all templates.');
    return this.workflowRepository.find({
      where: { isTemplate: true }, // 템플릿만 조회
      order: { createdAt: 'DESC' }, // 예: 최신순 정렬
      // relations: ['ownerUser'], // 필요시 ownerUser(User 엔티티) 정보 로드
    });
  }

  /**
   * ID로 특정 워크플로우 템플릿을 조회합니다. (Admin 전용)
   * @param id 조회할 템플릿의 ID
   * @returns Workflow 엔티티
   * @throws NotFoundException 해당 ID의 템플릿이 없거나 템플릿이 아닌 경우
   */
  async findOneTemplateById(id: number): Promise<Workflow> {
    console.log(`[WorkflowService] Finding template with ID #${id}.`);
    const template = await this.workflowRepository.findOne({
      where: { id, isTemplate: true }, // ID와 isTemplate 조건 모두 만족
      // relations: ['ownerUser'],
    });
    if (!template) {
      throw new NotFoundException(
        `Workflow template with ID #${id} not found.`,
      );
    }
    return template;
  }

  /**
   * 기존 워크플로우 템플릿을 수정합니다. (Admin 전용)
   * @param id 수정할 템플릿의 ID
   * @param updateDTO 수정할 정보 dto
   * @param adminUserId 수정 작업을 수행하는 관리자 ID
   * @returns 수정된 Workflow 엔티티
   * @throws NotFoundException 해당 ID의 템플릿이 없거나 템플릿이 아닌 경우
   */
  async updateTemplate(
    id: number,
    updateDTO: UpdateWorkflowTemplateDTO,
    adminUserId: number,
  ): Promise<Workflow> {
    // 먼저 해당 ID의 '템플릿'이 존재하는지 확인 (findOneTemplateById가 NotFoundException 처리)
    const existingTemplate = await this.findOneTemplateById(id);

    // (선택적) 추가적인 수정 권한 검증 로직
    // 예: 템플릿을 생성한 관리자만 수정 가능하게 하려면
    // if (existingTemplate.ownerUserId !== adminUserId) {
    //   throw new ForbiddenException('You do not have permission to update this template.');
    // }
    console.log(
      `[WorkflowService] Admin #${adminUserId} is updating template #${id}.`,
    );

    // DTO의 내용으로 기존 엔티티를 업데이트 (TypeORM의 merge 사용)
    const updatedTemplate = this.workflowRepository.merge(
      existingTemplate,
      updateDTO,
    );

    // ownerUserId는 일반적으로 생성 시 할당 후 변경하지 않지만,
    // 만약 마지막 수정한 관리자를 기록하고 싶다면 여기서 업데이트할 수 있습니다.
    // (그보다는 updatedAt 필드가 자동으로 관리되므로, 생성자를 유지하는 것이 일반적입니다.)
    // updatedTemplate.ownerUserId = adminUserId;

    return this.workflowRepository.save(updatedTemplate);
  }

  /**
   * 특정 워크플로우 템플릿을 삭제합니다. (Admin 전용)
   * @param id 삭제할 템플릿의 ID
   * @param adminUserId 삭제 작업을 수행하는 관리자 ID (로깅 또는 추가 권한 검증용)
   * @throws NotFoundException 해당 ID의 템플릿이 없거나 템플릿이 아닌 경우
   */
  async removeTemplate(id: number, adminUserId: number): Promise<void> {
    // 먼저 해당 ID의 '템플릿'이 존재하는지 확인합니다.
    // findOneTemplateById 메소드는 템플릿을 찾지 못하면 NotFoundException을 발생시킵니다.
    const templateToRemove = await this.findOneTemplateById(id);

    // (선택적) 추가적인 삭제 권한 검증 로직이 필요하다면 여기에 구현합니다.
    // 예를 들어, 특정 관리자만 삭제 가능하게 하거나, 생성한 관리자만 삭제할 수 있도록 하는 규칙 등입니다.
    // if (templateToRemove.ownerUserId !== adminUserId && ! /* 사용자의 슈퍼 관리자 여부 확인 등 */ ) {
    //   throw new ForbiddenException('You do not have permission to remove this template.');
    // }
    console.log(
      `[WorkflowService] Admin #${adminUserId} is removing template #${id} named "${templateToRemove.name}".`,
    );

    // TypeORM의 remove 메소드는 엔티티 인스턴스를 받아 삭제합니다.
    // 연관된 관계(예: 이 템플릿을 참조하는 '나만의 워크플로우' 인스턴스)에 대한 처리는
    // Workflow 엔티티의 @ManyToOne 또는 @OneToMany 데코레이터의 onDelete 옵션 ('SET NULL', 'CASCADE' 등)에 따라 달라집니다.
    // 현재 Workflow 엔티티의 sourceTemplate 관계에 onDelete: 'SET NULL'이 설정되어 있다면,
    // 이 템플릿을 참조하는 다른 Workflow 인스턴스들의 sourceTemplateId가 NULL로 설정됩니다.
    await this.workflowRepository.remove(templateToRemove);
    // void를 반환하므로, 별도의 return 문이 없습니다.
  }
}
