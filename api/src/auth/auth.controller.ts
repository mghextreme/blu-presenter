import { Body, Controller, Param, Post } from '@nestjs/common';
import { Public } from 'src/supabase/public.decorator';
import {
  AccessTokenDto,
  AuthDto,
  ChangePasswordDto,
  ExchangeCodeDto,
  OAuthRedirectDto,
  SignInDto,
  SignUpDto,
  TokenRefreshDto,
} from 'src/types';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  @Public()
  @Post('signIn')
  async signIn(@Body() signInDto: SignInDto): Promise<AccessTokenDto> {
    return await this.authService.signIn(signInDto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() tokenRefreshDto: TokenRefreshDto): Promise<AccessTokenDto> {
    return await this.authService.tokenRefresh(tokenRefreshDto);
  }

  @Public()
  @Post('sso/:provider')
  async sso(
    @Param('provider') provider: string,
    @Body() authDto: AuthDto,
  ): Promise<OAuthRedirectDto> {
    return await this.authService.signInWithProvider(provider, authDto);
  }

  @Public()
  @Post('validate')
  async validate(@Body() validateDto: ExchangeCodeDto): Promise<AccessTokenDto> {
    const accessToken = await this.authService.exchangeCodeForSession(
      validateDto.code,
      validateDto.codeVerifier,
    );

    if (validateDto.invite?.id && validateDto.invite?.secret) {
      try {
        const invitation  = await this.authService.organizationsService.associateInvite(
          accessToken.user.id,
          validateDto.invite,
        );

        accessToken.inviteOrgId = invitation.orgId;
      }
      catch (e) {
        console.warn(`Error associating invite: ${e}`);
      }
    }

    return accessToken;
  }

  @Public()
  @Post('signUp')
  async signUp(@Body() signUpDto: SignUpDto): Promise<AccessTokenDto> {
    return await this.authService.signUp(signUpDto);
  }

  @Post('changePassword')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(changePasswordDto);
  }
}
