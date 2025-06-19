import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role: Role;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column({ unique: true })
  googleId: string;

  @Column({ nullable: true, length: 2048 })
  imageUrl?: string;

  @Column({ nullable: true, select: false }) // select: false로 기본 조회 시에는 제외
  currentHashedRefreshToken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
