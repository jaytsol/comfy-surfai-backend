// src/common/entities/generated-output.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity'; // 실제 User 엔티티 경로
import { Workflow } from './workflow.entity'; // 실제 Workflow 엔티티 경로

@Entity('generated_outputs')
@Index(['ownerUserId', 'createdAt']) // 사용자의 히스토리 조회를 위해 복합 인덱스 추가
export class GeneratedOutput {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 2048,
    comment: 'Cloudflare R2에 저장된 파일의 최종 URL',
  })
  r2Url: string;

  @Column({ comment: 'ComfyUI가 생성한 원본 파일명' })
  originalFilename: string;

  @Column({ comment: '파일의 MIME 타입 (예: image/png)' })
  mimeType: string;

  @Index() // 이 ID로 조회가 있을 수 있으므로 인덱스 추가
  @Column({ comment: '이 결과물을 생성한 ComfyUI 작업의 고유 ID' })
  promptId: string;

  @Index()
  @Column({ comment: '이 결과물을 생성한 사용자의 ID' })
  ownerUserId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true }) // 사용자가 탈퇴해도 결과물은 남도록 SET NULL
  @JoinColumn({ name: 'ownerUserId' })
  ownerUser: User;

  @Index()
  @Column({ comment: '생성에 사용된 워크플로우 템플릿의 ID' })
  sourceWorkflowId: number;

  @ManyToOne(() => Workflow, { onDelete: 'SET NULL', nullable: true }) // 템플릿이 삭제돼도 결과물은 남도록 SET NULL
  @JoinColumn({ name: 'sourceWorkflowId' })
  sourceWorkflow: Workflow;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '생성에 사용된 동적 파라미터들',
  })
  usedParameters?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' }) // 타임존 포함
  createdAt: Date;
}
