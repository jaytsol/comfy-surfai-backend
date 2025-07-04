import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { WorkflowParameterMappingItemDTO } from './common/dto/workflow/workflow-parameter-mapping-item.dto';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true, // 기본적으로 true이지만 명시적으로 설정
  });

  // JSON 및 URL-encoded 본문 크기 제한 증가
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);
  const isProduction = process.env.NODE_ENV === 'production';

  // --- CORS 설정 ---
  const allowedOrigins = ['http://localhost:4000'];
  const prodFrontendUrl = configService.get<string>('FRONTEND_URL');
  if (prodFrontendUrl) {
    allowedOrigins.push(prodFrontendUrl);
  }
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
    credentials: true,
  });

  // --- 공통 미들웨어 ---
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✨ --- 환경에 따른 CSRF 및 Swagger 설정 분기 --- ✨
  if (isProduction) {
    // --- ☁️ 운영 환경에서만 CSRF 보호 활성화 ---
    console.log('CSRF protection is enabled for production.');
    const rootDomain = configService.get<string>('ROOT_DOMAIN');
    const cookieDomain =
      rootDomain && rootDomain !== 'localhost' ? rootDomain : undefined;

    const csrfProtection = csurf({
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: cookieDomain,
      },
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.url === '/auth/refresh' && req.method === 'POST') {
        return next();
      }
      csrfProtection(req, res, next);
    });

    app.use((req: any, res, next) => {
      if (req.csrfToken) {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
          secure: true,
          sameSite: 'none',
          domain: cookieDomain,
        });
      }
      next();
    });
  } else {
    // --- 💻 개발 환경에서만 Swagger UI 활성화 ---
    console.log('Swagger UI is enabled for development.');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Surfai APIs (Development)')
      .setDescription('SurfAI API 개발 문서입니다.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [WorkflowParameterMappingItemDTO],
    });

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const appUrl = await app.getUrl();
  const wsUrl = appUrl.replace(/^http/, 'ws');

  console.log(`Application is running on: ${appUrl}`);
  console.log(`WebSocket is running on: ${wsUrl}`);
}
bootstrap();
