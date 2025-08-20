import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SocialService } from './social.service';
import { GoogleConnectGuard } from './guards/google-connect.guard';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('connect')
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(JwtAuthGuard, GoogleConnectGuard)
  async connectGoogle() {
    // The GoogleConnectGuard will handle the redirection to Google with a state parameter.
  }

  @Get('google/callback')
  @UseGuards(GoogleConnectGuard)
  async googleCallback(
    @Req() req,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.socialService.handleGoogleConnection(state, req.user);
    // Redirect user back to the frontend settings page after successful connection
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/settings/connections`);
  }

  // TODO: Implement GET /connections
  // TODO: Implement POST /disconnect/:platform
}
