import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './supabase/public.decorator';

/**
 * Hosts allowed for server-side redirect resolution.
 * This prevents the endpoint from being used as an open redirect proxy.
 */
const ALLOWED_REDIRECT_HOSTS = ['link.deezer.com'];

/**
 * Hosts that are valid as the final resolved destination.
 * The initial URL host is checked against ALLOWED_REDIRECT_HOSTS,
 * and the final URL host is checked against this list.
 */
const ALLOWED_RESOLVED_HOSTS = ['deezer.com'];

function isAllowedHost(hostname: string, allowedHosts: string[]): boolean {
  const normalized = hostname.replace('www.', '').toLowerCase();
  return allowedHosts.some(
    (h) => normalized === h || normalized.endsWith(`.${h}`),
  );
}

@Controller()
@ApiTags('health')
export class AppController {
  @Public()
  @Get()
  async healthCheck(): Promise<string> {
    return 'OK';
  }

  /**
   * Resolves a short/share link by following its redirect chain and returning
   * the final URL. Useful for services like Deezer whose share links
   * (link.deezer.com) cannot be resolved from the browser due to CORS.
   */
  @Public()
  @Get('resolve-redirect')
  async resolveRedirect(@Query('url') url: string): Promise<{ url: string }> {
    if (!url) {
      throw new BadRequestException('Missing required "url" query parameter');
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL');
    }

    const hostname = parsed.hostname.replace('www.', '');
    if (!ALLOWED_REDIRECT_HOSTS.includes(hostname)) {
      throw new BadRequestException(
        `Host "${parsed.hostname}" is not allowed. Allowed hosts: ${ALLOWED_REDIRECT_HOSTS.join(', ')}`,
      );
    }

    try {
      const response = await fetch(url, { redirect: 'follow' });
      const resolvedUrl = response.url;

      // Validate the final URL to prevent open-redirect abuse
      const resolvedHostname = new URL(resolvedUrl).hostname;
      if (!isAllowedHost(resolvedHostname, ALLOWED_RESOLVED_HOSTS)) {
        throw new BadRequestException(
          `Resolved host "${resolvedHostname}" is not allowed`,
        );
      }

      return { url: resolvedUrl };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to resolve URL');
    }
  }
}
