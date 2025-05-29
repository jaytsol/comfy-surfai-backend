// src/auth/guards/local-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SessionSerializer } from 'src/auth/session.serializer';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private readonly sessionSerializer: SessionSerializer) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let canProceedOriginal = false;

    // super.canActivate는 LocalStrategy를 실행하고, 성공 시 req.user를 채웁니다.
    // 세션이 활성화된 경우, 내부적으로 req.login()을 호출하여 세션을 수립하려고 시도합니다.
    canProceedOriginal = (await super.canActivate(context)) as boolean;

    if (canProceedOriginal && request.user) {
      await new Promise<void>((resolve, reject) => {
        // 바로 이 req.login() 함수가 SessionSerializer.serializeUser를 호출해야 합니다!
        request.logIn(request.user, (err) => {
          if (err) {
            return reject(
              new UnauthorizedException(
                'Session establishment failed during explicit login.',
              ),
            );
          }
          resolve();
        });
      });
    }
    return canProceedOriginal; // 원래 super.canActivate 결과 반환
  }
}
