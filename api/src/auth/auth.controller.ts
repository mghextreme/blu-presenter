import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/supabase/public.decorator';
import {
  AccessTokenDto,
  AuthDto,
  ChangePasswordDto,
  ExchangeCodeDto,
  ForgotPasswordDto,
  OAuthRedirectDto,
  OtpSignInRequestDto,
  OtpSignInVerifyDto,
  ResetPasswordDto,
  SetPasswordDto,
  SignInDto,
  SignUpDto,
  TokenRefreshDto,
  UserIdentitiesResponseDto,
} from 'src/types';
import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('auth')
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
      validateDto.locale,
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

  @Get('identities')
  async getIdentities(): Promise<UserIdentitiesResponseDto> {
    return await this.authService.getIdentities();
  }

  @Post('identities/:provider')
  async linkIdentity(
    @Param('provider') provider: string,
  ): Promise<OAuthRedirectDto> {
    return await this.authService.linkIdentity(provider);
  }

  @Delete('identities/:identityId')
  async unlinkIdentity(
    @Param('identityId') identityId: string,
  ): Promise<void> {
    await this.authService.unlinkIdentity(identityId);
  }

  @Post('setPassword')
  async setPassword(
    @Body() setPasswordDto: SetPasswordDto,
  ): Promise<void> {
    await this.authService.setPassword(setPasswordDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    if (!dto.captchaToken && this.captchaEnabled) {
      throw new HttpException('required captcha not set', HttpStatus.BAD_REQUEST);
    }

    await this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @Post('signIn/otp/request')
  async requestSignInOtp(@Body() dto: OtpSignInRequestDto): Promise<void> {
    if (!dto.captchaToken && this.captchaEnabled) {
      throw new HttpException('required captcha not set', HttpStatus.BAD_REQUEST);
    }

    await this.authService.requestSignInOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('signIn/otp/verify')
  async verifySignInOtp(@Body() dto: OtpSignInVerifyDto): Promise<AccessTokenDto> {
    return await this.authService.verifySignInOtp(dto);
  }
}
