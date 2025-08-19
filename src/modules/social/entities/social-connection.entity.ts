import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../common/entities/user.entity';

export enum SocialPlatform {
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
  X = 'X',
  THREADS = 'THREADS',
  TIKTOK = 'TIKTOK',
}

@Entity({ name: 'social_connections' })
export class SocialConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.socialConnections, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: SocialPlatform })
  platform: SocialPlatform;

  @Column()
  platformUsername: string;

  // TODO: Add encryption transformer
  @Column({ type: 'varchar', length: 512 })
  accessToken: string;

  // TODO: Add encryption transformer
  @Column({ type: 'varchar', length: 512, nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamptz' })
  connectedAt: Date;
}
