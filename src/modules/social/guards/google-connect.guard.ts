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

    // Only generate state for the initial /connect/google request
    // The callback /connect/google/callback does not need to generate state
    if (req.route.path === '/connect/google') {
      const state = this.socialService.generateState(req.user.id);
      return { state };
    }
    // For the callback, we don't need to pass any specific options to the strategy's authenticate method
    return undefined;
  }
}
