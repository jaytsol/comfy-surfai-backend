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
import { User } from './user.entity';

// 워크플로우 JSON 내의 특정 노드/입력을 가리키는 매핑 정보 타입
export interface WorkflowParameterMappingItem {
  node_id: string; // 대상 노드의 ID (ComfyUI JSON 내의 키)
  input_name: string; // 대상 노드 내의 입력 필드 이름
  description?: string;
  // value_type?: 'string' | 'number' | 'boolean'; // 필요시 값 타입 (선택)
}

@Entity('workflows') // 테이블명
export class Workflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // 템플릿 이름 또는 "나만의 워크플로우" 이름

  @Column({ type: 'text', nullable: true })
  description?: string;

  // --- 템플릿(isTemplate=true)일 때 주로 사용되는 필드 ---
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'ComfyUI workflow definition JSON',
  })
  definition?: object; // 템플릿의 원본 ComfyUI JSON

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Parameter mapping for the template',
  })
  parameter_map?: Record<string, WorkflowParameterMappingItem>;
  // 예: { "positive_prompt": { "node_id": "6", "input_name": "text" }, ... }

  @Column({ type: 'text', nullable: true })
  previewImageUrl?: string; // 템플릿 미리보기 이미지 URL

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]; // 템플릿 분류용 태그

  @Column({
    default: false,
    comment: 'Is this template available to all users?',
  })
  isPublicTemplate: boolean; // 템플릿의 공개 여부 (isTemplate=true일 때 의미)
  // --- 템플릿 필드 끝 ---

  // --- 사용자 소유 워크플로우(isTemplate=false)일 때 주로 사용되는 필드 ---
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'User-defined parameter values for this instance',
  })
  user_parameter_values?: Record<string, any>;
  // 예: { "positive_prompt": "my specific cat prompt", "seed": 42 }
  // --- 사용자 소유 워크플로우 필드 끝 ---

  @Column({
    default: true,
    comment: 'Is this record a template or a user instance?',
  })
  isTemplate: boolean; // true면 템플릿, false면 사용자 소유 인스턴스

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'ownerUserId' }) // DB 컬럼명
  ownerUser?: User; // 템플릿 생성자(admin) 또는 사용자 인스턴스 소유자

  @Index() // 검색 성능을 위해 인덱스 추가
  @Column({ nullable: true })
  ownerUserId?: number;

  @ManyToOne(() => Workflow, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: false,
  }) // 자기 참조 관계
  @JoinColumn({ name: 'sourceTemplateId' })
  sourceTemplate?: Workflow; // 사용자 인스턴스인 경우, 원본 템플릿을 가리킴

  @Index()
  @Column({ nullable: true })
  sourceTemplateId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
