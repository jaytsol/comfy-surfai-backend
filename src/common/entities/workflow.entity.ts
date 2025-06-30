// src/workflow/workflow.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkflowParameterMappingItemDTO } from '../dto/workflow/workflow-parameter-mapping-item.dto';
import { User } from './user.entity';

@Entity('workflows') // 테이블명
export class Workflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // 템플릿 이름 또는 "나만의 워크플로우" 이름

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Category of the workflow template (e.g., image, video)' })
  category?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'ComfyUI workflow definition JSON',
  })
  definition?: object;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Parameter mapping for the template',
  })
  parameter_map?: Record<string, WorkflowParameterMappingItemDTO>; // 타입을 DTO와 일치시킴

  @Column({ type: 'text', nullable: true })
  previewImageUrl?: string; // 템플릿 미리보기 이미지 URL

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]; // 템플릿 분류용 태그

  @Column({
    default: false,
    comment: 'Is this template available to all users?',
  })
  isPublicTemplate: boolean;
  // --- 템플릿 필드 끝 ---

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'User-defined parameter values for this instance',
  })
  user_parameter_values?: Record<string, any>;

  @Column({
    default: true,
    comment: 'Is this record a template or a user instance?',
  })
  isTemplate: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'ownerUserId' })
  ownerUser?: User;

  @Index()
  @Column({ nullable: true })
  ownerUserId?: number;

  @ManyToOne(() => Workflow, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: false,
  }) // 자기 참조 관계
  @JoinColumn({ name: 'sourceTemplateId' })
  sourceTemplate?: Workflow;

  @Index()
  @Column({ nullable: true })
  sourceTemplateId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
