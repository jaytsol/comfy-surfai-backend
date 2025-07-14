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
import { User } from './user.entity';
import { Workflow } from './workflow.entity';

@Entity('generated_outputs')
@Index(['ownerUserId', 'createdAt'])
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

  @Index()
  @Column({ comment: '이 결과물을 생성한 ComfyUI 작업의 고유 ID' })
  promptId: string;

  @Index()
  @Column({ comment: '이 결과물을 생성한 사용자의 ID' })
  ownerUserId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerUserId' })
  ownerUser: User;

  @Index()
  @Column({ comment: '생성에 사용된 워크플로우 템플릿의 ID' })
  sourceWorkflowId: number;

  @ManyToOne(() => Workflow, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sourceWorkflowId' })
  sourceWorkflow: Workflow;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '생성에 사용된 동적 파라미터들',
  })
  usedParameters?: Record<string, any>;

  @Column({
    type: 'float',
    nullable: true,
    comment: '생성에 소요된 시간 (초)',
  })
  duration?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
