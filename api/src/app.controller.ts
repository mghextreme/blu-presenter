import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  async healthCheck(): Promise<string> {
    return 'OK';
  }
}
