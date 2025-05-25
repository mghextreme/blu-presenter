import { Body, Controller, Inject, Post } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { Public } from 'src/supabase/public.decorator';
import {
  AccessTokenDto,
  ChangePasswordDto,
  SignInDto,
  SignUpDto,
  TokenRefreshDto,
} from 'src/types';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(REQUEST) private readonly request: ExpRequest,
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
