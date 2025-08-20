import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SocialService } from '../social.service';

@Injectable()
export class GoogleConnectGuard extends AuthGuard('google-youtube') {
  constructor(private readonly socialService: SocialService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext): any {
    const req = context.switchToHttp().getRequest();
    const state = this.socialService.generateState(req.user.id);
    return { state };
  }
}
