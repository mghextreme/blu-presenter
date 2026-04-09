import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  private readonly configService: ConfigService;

  constructor(app: INestApplicationContext) {
    super(app);
    this.configService = app.get(ConfigService);
  }

  createIOServer(port: number, options?: Partial<ServerOptions>) {
    const baseUrl = this.configService.get<string>('app.baseUrl');

    const serverOptions: Partial<ServerOptions> = {
      ...options,
      cors: {
        origin: baseUrl,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    };

    return super.createIOServer(port, serverOptions);
  }
}
