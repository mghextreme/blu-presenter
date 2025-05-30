import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { Request, Response } from 'express';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { parseCookies, setCookie, destroyCookie } from 'nookies';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const createCustomStorageAdapter = (req: Request, res: Response, collection: {[key: string]: string}) => {
  return {
    getItem: (key: string) => {
      const cookies = parseCookies({ req });
      let item = cookies[key];
      if (!item) {
        item = collection[key] || null;
      }
      return item;
    },
    setItem: (key: string, value) => {
      collection[key] = value;
      if (key.endsWith('auth-token-code-verifier')) {
        collection['auth-token-code-verifier'] = `${key}=${value}`;
      }
      setCookie({ res }, key, value, {
        path: '/',
        maxAge: 60 * 10, // 10 minutes
        secure: true, // Ensure cookies are sent over HTTPS
        httpOnly: true, // Ensure cookies are not accessible via JavaScript
      });
    },
    removeItem: (key: string) => {
      destroyCookie({ res }, key, {
        path: '/',
      });
    },
  };
};

@Injectable({ scope: Scope.REQUEST })
export class Supabase {
  private readonly logger = new Logger(Supabase.name);
  private clientInstance: SupabaseClient;
  public cookieValues: {[key: string]: string} = {};

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly configService: ConfigService,
  ) {}

  getClient(response?: Response) {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const req = this.request;
    const customStorageAdapter = createCustomStorageAdapter(req, response, this.cookieValues);
    const cookies = parseCookies({ req });

    this.clientInstance = createClient(
      this.configService.get('supabase.url')!,
      this.configService.get('supabase.key')!,
      {
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: customStorageAdapter,
        },
        global: {
          headers: req?.headers ? {
            'x-supabase-auth': cookies['sb-access-token'],
            'Cookie': req.headers.cookie || '',
          } : {},
        },
      }
    );

    return this.clientInstance;
  }
}
