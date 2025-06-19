// src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'; // ForbiddenException 추가
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/enums/role.enum'; // Role Enum 경로에 맞게 수정
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException(
        '접근 권한이 없습니다 (사용자 정보 또는 역할 누락).',
      );
    }

    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `이 기능에 접근하려면 다음 역할 중 하나가 필요합니다: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
