import { Body, Controller, HttpException, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
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

@Controller('auth')
export class AuthController {
  private readonly captchaEnabled: boolean;

  constructor(
    private authService: AuthService,
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    this.captchaEnabled = configService.get('captcha.enabled');
  }

  @Public()
  @Post('signIn')
  async signIn(@Body() signInDto: SignInDto): Promise<AccessTokenDto> {
    if (!signInDto.captchaToken && this.captchaEnabled) {
      throw new HttpException('required captcha not set', HttpStatus.BAD_REQUEST);
    }

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
  @Throttle({ default: { ttl: 60000, limit: 5 } })
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
    if (!signUpDto.captchaToken && this.captchaEnabled) {
      throw new HttpException('required captcha not set', HttpStatus.BAD_REQUEST);
    }

    return await this.authService.signUp(signUpDto);
  }

  @Post('changePassword')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(changePasswordDto);
  }
}
