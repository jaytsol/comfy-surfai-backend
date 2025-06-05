// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WorkflowParameterMappingItemDTO } from './common/dto/workflow/workflow-parameter-mapping-item.dto';
import { WsAdapter } from '@nestjs/platform-ws';
import * as fs from 'fs'; // 파일 시스템 모듈 임포트
import * as path from 'path'; // 경로 모듈 임포트

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(
      path.join(__dirname, '../..', 'certs', 'localhost+2-key.pem'),
    ),
    cert: fs.readFileSync(
      path.join(__dirname, '../..', 'certs', 'localhost+2.pem'),
    ),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS 설정 추가
  app.enableCors({
    origin: 'http://localhost:4000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const PGStore = connectPgSimple(session);
  const sessionStore = new PGStore({
    conString: configService.get<string>('DATABASE_URL'),
    tableName: 'sessions',
    createTableIfMissing: true,
  });

  app.use(
    session({
      store: sessionStore,
      secret: configService.get<string>('SESSION_SECRET') as any,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        sameSite: 'lax',
      },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Surfai APIs') // API 문서의 제목
    .setDescription(
      'NestJS와 ComfyUI를 연동한 AI 이미지 및 비디오 생성 서비스 Surfai의 API 문서입니다.',
    ) // API에 대한 설명
    .setVersion('1.0') // API 버전
    .addCookieAuth('connect.sid') // 세션 쿠키 인증 방식 명시 (선택 사항이지만 유용)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [WorkflowParameterMappingItemDTO],
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 인증 상태 유지 (페이지 새로고침 시에도)
    },
  });

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(configService.get<number>('PORT') ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(
    `WebSocket (WSS) is running on: wss://localhost:${configService.get<number>('PORT') ?? 3000}`,
  );
}
bootstrap();
