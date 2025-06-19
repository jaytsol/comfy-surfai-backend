import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { WorkflowParameterMappingItemDTO } from './common/dto/workflow/workflow-parameter-mapping-item.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new WsAdapter(app));

  const configService = app.get(ConfigService);

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
