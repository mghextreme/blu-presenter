import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
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
import { User } from 'src/entities';
import { AuthService } from './auth.service';
import { AccessToken, CurrentUser } from './request-context.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  private readonly captchaEnabled: boolean;

  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    this.captchaEnabled = configService.get('captcha.enabled') === true;
  }

  @Public()
  @Post('signIn')
  async signIn(@Body() signInDto: SignInDto): Promise<AccessTokenDto> {
    if (!signInDto.captchaToken && this.captchaEnabled) {
      throw new HttpException(
        'required captcha not set',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.authService.signIn(signInDto);
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() tokenRefreshDto: TokenRefreshDto,
  ): Promise<AccessTokenDto> {
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
  async validate(
    @Body() validateDto: ExchangeCodeDto,
  ): Promise<AccessTokenDto> {
    const accessToken = await this.authService.exchangeCodeForSession(
      validateDto.code,
      validateDto.codeVerifier,
      validateDto.locale,
    );

    if (
      accessToken.user &&
      validateDto.invite?.id &&
      validateDto.invite?.secret
    ) {
      accessToken.inviteOrgId = await this.authService.associateInvite(
        accessToken.user.id,
        validateDto.invite,
      );
    }

    return accessToken;
  }

  @Public()
  @Post('signUp')
  async signUp(@Body() signUpDto: SignUpDto): Promise<AccessTokenDto> {
    if (!signUpDto.captchaToken && this.captchaEnabled) {
      throw new HttpException(
        'required captcha not set',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.authService.signUp(signUpDto);
  }

  @Post('changePassword')
  async changePassword(
    @CurrentUser() user: User,
    @AccessToken() accessToken: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user, accessToken, changePasswordDto);
  }

  @Get('identities')
  async getIdentities(
    @AccessToken() accessToken: string,
  ): Promise<UserIdentitiesResponseDto> {
    return await this.authService.getIdentities(accessToken);
  }

  @Post('identities/:provider')
  async linkIdentity(
    @AccessToken() accessToken: string,
    @Param('provider') provider: string,
  ): Promise<OAuthRedirectDto> {
    return await this.authService.linkIdentity(provider, accessToken);
  }

  @Delete('identities/:identityId')
  async unlinkIdentity(
    @AccessToken() accessToken: string,
    @Param('identityId') identityId: string,
  ): Promise<void> {
    await this.authService.unlinkIdentity(identityId, accessToken);
  }

  @Post('setPassword')
  async setPassword(
    @AccessToken() accessToken: string,
    @Body() setPasswordDto: SetPasswordDto,
  ): Promise<void> {
    await this.authService.setPassword(setPasswordDto, accessToken);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @Post('password/forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    if (!dto.captchaToken && this.captchaEnabled) {
      throw new HttpException(
        'required captcha not set',
        HttpStatus.BAD_REQUEST,
      );
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
      throw new HttpException(
        'required captcha not set',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.requestSignInOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('signIn/otp/verify')
  async verifySignInOtp(
    @Body() dto: OtpSignInVerifyDto,
  ): Promise<AccessTokenDto> {
    return await this.authService.verifySignInOtp(dto);
  }
}
