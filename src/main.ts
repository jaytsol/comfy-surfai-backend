import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { WorkflowParameterMappingItemDTO } from './common/dto/workflow/workflow-parameter-mapping-item.dto';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);

  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  let cookieDomain: string | undefined = undefined;

  if (isProduction && frontendUrl) {
    const frontendHost = new URL(frontendUrl).hostname;
    const domainParts = frontendHost.split('.');
    cookieDomain = domainParts.slice(-2).join('.'); // 예: 'run.app'
  }

  app.use(cookieParser());

  const csrfProtection = csurf({
    cookie: {
      httpOnly: true, // CSRF 토큰 쿠키도 httpOnly로 설정하여 보안 강화
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain: cookieDomain,
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    // '/auth/refresh' 경로의 POST 요청은 CSRF 보호를 건너뜁니다.
    if (req.url === '/auth/refresh' && req.method === 'POST') {
      return next();
    }
    // 그 외의 모든 요청에는 CSRF 보호를 적용합니다.
    csrfProtection(req, res, next);
  });

  app.use((req: any, res, next) => {
    // csurf가 생성한 CSRF 토큰을 'XSRF-TOKEN'이라는 이름의 새로운 쿠키에 담아 보냅니다.
    // 이 쿠키는 httpOnly가 아니므로, 프론트엔드 JavaScript가 읽을 수 있습니다.
    if (req.csrfToken) {
      res.cookie('XSRF-TOKEN', req.csrfToken(), {
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: cookieDomain,
      });
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✨ --- CORS 설정 추가 (필수) --- ✨
  const allowedOrigins = [
    'http://localhost:4000', // 로컬 프론트엔드 개발 환경
  ];
  const prodFrontendUrl = configService.get<string>('FRONTEND_URL');
  if (prodFrontendUrl) {
    allowedOrigins.push(prodFrontendUrl);
  }
  // 백엔드 자신의 URL도 허용 목록에 추가 (Swagger UI 등에서의 테스트를 위해)
  // getUrl()은 listen() 후에 호출해야 하므로, 여기서는 환경 변수를 사용하거나 고정값을 사용합니다.
  const prodBackendUrl = configService.get<string>('API_BASE_URL');
  if (prodBackendUrl) {
    allowedOrigins.push(prodBackendUrl);
  }
  console.log('Allowed CORS origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(`CORS Error: Origin ${origin} is not allowed.`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // 쿠키 또는 Authorization 헤더를 주고받기 위해 필수
  });

  // Swagger 설정
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Surfai APIs')
    .setDescription(
      'NestJS와 ComfyUI를 연동한 AI 이미지 및 비디오 생성 서비스 Surfai의 API 문서입니다.',
    )
    .setVersion('1.0')
    .addBearerAuth() // ✨ JWT 인증 방식을 사용하므로 addCookieAuth 대신 addBearerAuth 사용
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [WorkflowParameterMappingItemDTO],
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const appUrl = await app.getUrl();
  const wsUrl = appUrl.replace(/^http/, 'ws');

  console.log(`Application is running on: ${appUrl}`);
  console.log(`WebSocket is running on: ${wsUrl}`);
}
bootstrap();
