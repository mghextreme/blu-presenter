/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/types';
import { IAuthResponse } from '@/types/auth';
import { DefaultError, QueryClient, QueryExecuteOptions, QueryKey } from '@tanstack/react-query';

// Statuses from POST /auth/refresh that mean the refresh token itself is no
// longer valid. Anything else (5xx, 429, network) is transient: the session
// is kept and the error propagates to the caller.
const INVALID_REFRESH_STATUSES = [400, 401, 403];

// Shared by every ApiService instance so concurrent 401s across services
// trigger a single refresh (refresh tokens are single-use).
let refreshPromise: Promise<void> | null = null;

export abstract class ApiService {
  protected queryClient: QueryClient;
  protected url: string;

  constructor(queryClient: QueryClient, config: { url: string }) {
    this.queryClient = queryClient;
    this.url = config.url;
  }

  private get session() {
    return useAuth.getState().session;
  }

  protected refreshSession = async () => {
    // Deduplicate concurrent refresh attempts: if a refresh is already
    // in progress, all callers await the same promise.
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = this.performRefresh();
    try {
      await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  };

  private performRefresh = async () => {
    try {
      const { user, session } = (await this.postRequest(
        '/auth/refresh',
        JSON.stringify({
          refreshToken: this.session?.refresh_token,
        }),
        {
          'content-type': 'application/json',
        },
        false,
      )) as IAuthResponse;

      if (!user || !session) {
        throw new ApiError(401, 'Unauthorized');
      }

      useAuth.setState({
        isLoggedIn: true,
        user: user,
        session: session,
      });
    } catch (e) {
      if (e instanceof ApiError && INVALID_REFRESH_STATUSES.includes(e.status)) {
        useAuth.setState({
          isLoggedIn: false,
          user: null,
          session: null,
          organization: null,
          organizations: [],
        });
      } else {
        throw e;
      }
    }
  };

  /** Fetches through the cache, bypassing freshness: always requests the API. */
  protected fetchFresh<TData, TKey extends QueryKey>(
    query: QueryExecuteOptions<TData, DefaultError, TData, TData, TKey>,
  ): Promise<TData> {
    return this.queryClient.query({ ...query, staleTime: 0 });
  }

  /**
   * Runs `request`, answering from the offline store instead when the browser
   * is offline or the request never reached the API.
   */
  protected async withOfflineFallback<T>(
    request: () => Promise<T>,
    offline: () => Promise<T>,
  ): Promise<T> {
    if (this.isOffline()) {
      return await offline();
    }
    try {
      return await request();
    } catch (e) {
      if (this.isNetworkError(e)) {
        return await offline();
      }
      throw e;
    }
  }

  /** True when the browser reports no network connection. */
  protected isOffline = (): boolean =>
    typeof navigator !== 'undefined' && navigator.onLine === false;

  /**
   * Distinguishes transport failures (fetch TypeError, timeouts — i.e. the
   * request never reached the API) from API errors (ApiError carries a
   * status). Read paths fall back to the offline store on transport failures.
   */
  protected isNetworkError = (e: unknown): boolean => !(e instanceof ApiError);

  private getHeaders = (baseHeaders: { [key: string]: string }): { [key: string]: string } => {
    const result = { ...baseHeaders };

    const session = this.session;
    if (session) {
      result['Authorization'] = 'Bearer ' + session.access_token;
    }

    return result;
  };

  protected getRequest = async (
    path: string,
    headers: { [key: string]: string } = {},
    refreshAuth: boolean = true,
  ): Promise<any> => {
    return await this.internalFetch(path, 'GET', undefined, headers, refreshAuth);
  };

  protected getTextRequest = async (
    path: string,
    headers: { [key: string]: string } = {},
    refreshAuth: boolean = true,
  ): Promise<string> => {
    const headersWithAuth = this.getHeaders(headers);
    const response = await fetch(this.url + path, {
      method: 'GET',
      headers: headersWithAuth,
    });

    if (response.ok) {
      return await response.text();
    } else if (refreshAuth && response.status === 401 && headersWithAuth['Authorization']) {
      await this.refreshSession();
      return await this.getTextRequest(path, headers, false);
    } else {
      throw new ApiError(response.status, `API Error: ${response.status}`, response);
    }
  };

  protected postRequest = async (
    path: string,
    body?: string,
    headers: { [key: string]: string } = {},
    refreshAuth: boolean = true,
  ): Promise<any> => {
    return await this.internalFetch(path, 'POST', body, headers, refreshAuth);
  };

  protected putRequest = async (
    path: string,
    body?: string,
    headers: { [key: string]: string } = {},
    refreshAuth: boolean = true,
  ): Promise<any> => {
    return await this.internalFetch(path, 'PUT', body, headers, refreshAuth);
  };

  protected deleteRequest = async (
    path: string,
    headers: { [key: string]: string } = {},
    refreshAuth: boolean = true,
  ): Promise<any> => {
    return await this.internalFetch(path, 'DELETE', undefined, headers, refreshAuth);
  };

  private internalFetch = async (
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: string,
    baseHeaders: { [key: string]: string } = {},
    refreshAuth: boolean = true,
  ): Promise<any> => {
    const headers = this.getHeaders(baseHeaders);
    const response = await fetch(this.url + path, {
      method,
      headers,
      ...(body === undefined ? {} : { body }),
    });

    if (response.ok) {
      try {
        return await response.json();
      } catch (e) {
        return null;
      }
    } else if (refreshAuth && response.status === 401 && headers['Authorization']) {
      await this.refreshSession();
      return await this.internalFetch(path, method, body, baseHeaders, false);
    } else {
      throw new ApiError(response.status, `API Error: ${response.status}`, response);
    }
  };
}
