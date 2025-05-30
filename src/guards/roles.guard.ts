// src/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'; // ForbiddenException 추가
import { Reflector } from '@nestjs/core';
import { Role } from 'src/enums/role.enum'; // Role Enum 경로에 맞게 수정
import { ROLES_KEY } from 'src/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 핸들러 또는 클래스에 설정된 @Roles() 메타데이터를 가져옵니다.
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // 현재 요청을 처리하는 핸들러
      context.getClass(), // 핸들러가 속한 컨트롤러 클래스
    ]);

    // @Roles() 데코레이터가 설정되지 않았다면, 역할 검사를 할 필요가 없습니다.
    // 이 경우 접근을 허용할지 (true) 또는 기본적으로 거부할지 (false)는 정책에 따라 결정합니다.
    // 여기서는 @Roles()가 없으면 일단 통과시키도록 하겠습니다.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // AuthenticatedGuard가 먼저 실행되어 req.user가 설정되어 있다고 가정합니다.
    // 사용자가 없거나, 사용자 객체에 role 속성이 없다면 접근을 거부합니다.
    if (!user || !user.role) {
      throw new ForbiddenException(
        '접근 권한이 없습니다 (사용자 정보 또는 역할 누락).',
      );
    }

    // 사용자의 역할이 @Roles()에 지정된 역할 중 하나라도 포함되는지 확인합니다.
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `이 기능에 접근하려면 다음 역할 중 하나가 필요합니다: ${requiredRoles.join(', ')}`,
      );
    }

    return true; // 필요한 역할을 가지고 있으면 접근 허용
  }
}
