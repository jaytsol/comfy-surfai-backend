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
import { ParameterMapCategory } from '../enums/parameter-map-category.enum';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Category of the workflow template (e.g., image, video)',
  })
  category?: ParameterMapCategory;

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
  parameter_map?: Record<string, WorkflowParameterMappingItemDTO>;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Number of required image inputs for the template',
  })
  requiredImageCount: number;

  @Column({ type: 'text', nullable: true })
  previewImageUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ default: 1, comment: 'Cost to use this workflow template' })
  cost: number;

  @Column({
    default: false,
    comment: 'Is this template available to all users?',
  })
  isPublicTemplate: boolean;

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
  })
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
