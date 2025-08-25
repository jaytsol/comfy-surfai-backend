// src/auth/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    // const request = context.switchToHttp().getRequest();
    // console.log(
    //   'req.user in JwtAuthGuard (after super.canActivate):',
    //   request.user,
    // );
    return result;
  }
}
