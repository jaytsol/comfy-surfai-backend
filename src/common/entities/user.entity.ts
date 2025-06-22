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

  @Column({ nullable: true, select: false })
  password?: string;

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

  @Column({ type: 'varchar', nullable: true, select: false })
  currentHashedRefreshToken?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
