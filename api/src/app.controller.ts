import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './supabase/public.decorator';

@Controller()
@ApiTags('health')
export class AppController {
  @Public()
  @Get()
  async healthCheck(): Promise<string> {
    return 'OK';
  }
}
