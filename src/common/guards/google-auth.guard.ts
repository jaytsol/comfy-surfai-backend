import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  /**
   * 이 가드는 Passport의 'google' 전략을 사용하여 인증 흐름을 시작합니다.
   * canActivate를 오버라이드하여 Passport의 기본 동작을 트리거합니다.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // AuthGuard('google')의 canActivate를 호출하여 Google OAuth 흐름을 시작합니다.
    const activate = (await super.canActivate(context)) as boolean;

    // 요청 객체에 'user' 속성을 첨부하기 위해 세션 초기화를 트리거합니다.
    const request = context.switchToHttp().getRequest();
    await super.logIn(request);

    return activate;
  }
}
