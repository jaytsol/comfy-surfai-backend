import { DataSource } from 'typeorm';
import { User } from './common/entities/user.entity';
import { Workflow } from './common/entities/workflow.entity';
import { GeneratedOutput } from './common/entities/generated-output.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 환경 변수 로드
dotenv.config({
  path: path.resolve(
    __dirname,
    `../.env.${process.env.NODE_ENV || 'development'}`,
  ),
});

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false, // 마이그레이션 사용 시 false
  logging: true,
  entities: [User, Workflow, GeneratedOutput],
  migrations: [__dirname + '/migrations/**/*.ts'],
  subscribers: [],
});

export default AppDataSource;
