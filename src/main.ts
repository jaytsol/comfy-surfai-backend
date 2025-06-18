// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { WorkflowParameterMappingItemDTO } from './common/dto/workflow/workflow-parameter-mapping-item.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);

  const isProduction = process.env.NODE_ENV === 'production';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const frontendUrlString = configService.get<string>('FRONTEND_URL');
  const sessionSecret = configService.get<string>('SESSION_SECRET');

  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not defined in the configuration');
  }

  // CORS 설정 추가
  app.enableCors({
    origin: (origin, callback) => {
      // Postman 같은 서버 간 요청(origin이 없는 경우)이나, 허용된 origin 목록에 있는 경우 통과
      if (
        !origin ||
        (frontendUrlString && frontendUrlString.includes(origin))
      ) {
        callback(null, true);
      } else {
        // 허용되지 않은 origin의 경우 에러 발생
        callback(new Error('Not allowed by CORS'));
      }
    },
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

  const cookieConfig: session.CookieOptions = {
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
  };

  if (isProduction) {
    // 운영 환경에서는 SameSite와 Domain을 명시적으로 설정합니다.
    cookieConfig.sameSite = 'none';

    if (frontendUrlString) {
      // 'https://' 프로토콜 부분을 제외한 순수 호스트 이름만 추출합니다.
      const frontendHost = new URL(frontendUrlString).hostname;

      // 최상위 도메인(eTLD+1)을 동적으로 계산합니다. (예: 'run.app')
      // 이렇게 하면 'surfai-frontend...run.app'와 'surfai-backend...run.app'이
      // 같은 사이트로 인식될 가능성이 높아집니다.
      const domainParts = frontendHost.split('.');
      const topLevelDomain = domainParts.slice(-2).join('.'); // 예: 'run.app'

      cookieConfig.domain = topLevelDomain;

      console.log(`Production cookie domain set to: .${topLevelDomain}`);
    } else {
      console.error(
        'FATAL: FRONTEND_URL is not set in production environment!',
      );
    }
  } else {
    // 개발 환경에서는 'lax'가 더 간단하고 잘 동작합니다.
    cookieConfig.sameSite = 'lax';
  }

  app.use(
    session({
      store: sessionStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: cookieConfig, // ✨ 수정된 쿠키 설정을 적용
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
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  const appUrl = await app.getUrl();
  const wsUrl = appUrl.replace(/^http/, 'ws');

  console.log(`Application is running on: ${appUrl}`);
  console.log(`WebSocket (WSS) is running on: ${wsUrl}`);
}
bootstrap();
