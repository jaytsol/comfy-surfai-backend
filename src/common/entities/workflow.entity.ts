// src/workflow/workflow.entity.ts (수정 제안)

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

// ... imports ...
export interface WorkflowParameterMapping {
  node_id: string;
  input_name: string /* value_type?: string; */;
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // 템플릿 이름 또는 "나만의 워크플로우" 이름

  @Column({ type: 'text', nullable: true })
  description?: string;

  // --- 템플릿 전용 필드 (isTemplate === true 일 때 주로 사용) ---
  @Column({ type: 'jsonb', nullable: true }) // 템플릿인 경우에만 원본 JSON 저장
  definition?: object;

  @Column({ type: 'jsonb', nullable: true }) // 템플릿인 경우에만 파라미터 맵 저장
  parameter_map?: Record<string, WorkflowParameterMapping>;

  @Column({ type: 'text', nullable: true }) // 템플릿에 대한 미리보기 이미지
  previewImageUrl?: string;

  @Column({ type: 'simple-array', nullable: true }) // 템플릿에 대한 태그
  tags?: string[];
  // --- 템플릿 전용 필드 끝 ---

  // --- 사용자 소유 워크플로우 전용 필드 (isTemplate === false 일 때 주로 사용) ---
  @Column({ type: 'jsonb', nullable: true }) // 사용자가 설정한 파라미터 값들
  user_parameter_values?: Record<string, any>; // 예: { "positive_prompt": "my custom prompt", "seed": 42 }
  // --- 사용자 소유 워크플로우 전용 필드 끝 ---

  @Column({ default: true }) // 이 레코드가 템플릿인지 여부. true면 템플릿, false면 사용자 인스턴스.
  isTemplate: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) // 템플릿 생성자 또는 사용자 인스턴스 소유자
  @JoinColumn({ name: 'ownerUserId' })
  ownerUser?: User; // nullable: 시스템 템플릿은 소유자가 없을 수도 있음

  @Column({ nullable: true })
  ownerUserId?: number; // ownerUser의 ID를 직접 저장 (검색 편의성)

  @ManyToOne(() => Workflow, { nullable: true, onDelete: 'SET NULL' }) // 사용자 인스턴스인 경우, 원본 템플릿을 가리킴
  @JoinColumn({ name: 'sourceTemplateId' })
  sourceTemplate?: Workflow;

  @Column({ nullable: true })
  sourceTemplateId?: number; // sourceTemplate의 ID

  @Column({ default: false }) // 템플릿의 공개 여부
  isPublicTemplate: boolean; // isTemplate이 true일 때만 의미 있음

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
