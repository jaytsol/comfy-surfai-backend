import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const PGStore = connectPgSimple(session);
  const sessionStore = new PGStore({
    conString: configService.get<string>('DATABASE_URL'),
    tableName: 'sessions',
    createTableIfMissing: true,
  });

  app.use(
    session({
      store: sessionStore,
      secret: configService.get<string>('SESSION_SECRET') ?? '',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        // secure: configService.get<string>('NODE_ENV === 'production', // HTTPS 환경에서만
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(configService.get<number>('PORT') ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
