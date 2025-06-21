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
  let cookieDomain: string | undefined = undefined;

  if (isProduction) {
    const rootDomain = configService.get<string>('ROOT_DOMAIN');
    if (rootDomain && rootDomain !== 'localhost') {
      cookieDomain = `.${rootDomain}`;
    }
  }

  app.use(cookieParser());

  const csrfProtection = csurf({
    cookie: {
      httpOnly: true,
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
    `http://localhost:4000`,
    `https://${configService.get<string>('ROOT_DOMAIN')}`,
  ];
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
    credentials: true,
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
