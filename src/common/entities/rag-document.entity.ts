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

export enum RagDocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR',
}

@Entity('rag_documents')
export class RagDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ownerUserId: number;

  @ManyToOne(() => User, (user) => user.ragDocuments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerUserId' })
  owner: User;

  @Column()
  originalFilename: string;

  @Column()
  r2Url: string;

  @Column()
  mimeType: string;

  @Column({
    type: 'enum',
    enum: RagDocumentStatus,
    default: RagDocumentStatus.UPLOADED,
  })
  status: RagDocumentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
