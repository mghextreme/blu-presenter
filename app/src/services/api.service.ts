/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/types";
import { IAuthResponse } from "@/types/auth";
import { FetchQueryOptions, QueryClient } from "@tanstack/react-query";

export abstract class ApiService {

  protected queryClient: QueryClient;
  protected url: string;

  constructor(queryClient: QueryClient, config: { url: string }) {
    this.queryClient = queryClient;
    this.url = config.url;
  }

  private get organization() {
    return useAuth.getState().organization?.id;
  }

  private get session() {
    return useAuth.getState().session;
  }

  private refreshSession = async () => {
    try {
      const { session } = await this.postRequest('/auth/refresh', JSON.stringify({
        refreshToken: this.session?.refresh_token,
      }), {}, false) as IAuthResponse;

      useAuth.setState({
        session: session,
      });
    }
    catch (e) {
      if (e instanceof ApiError) {
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
  }

  protected async getOrFetch<T>(query: FetchQueryOptions<T>): Promise<T> {
    return (
      this.queryClient.getQueryData(query.queryKey) ??
      (await this.queryClient.fetchQuery(query))
    );
  }

  private getHeaders = (baseHeaders: {[key: string]: string}): {[key: string]: string} => {
    const result = {...baseHeaders};

    const session = this.session;
    if (session) {
      result['Authorization'] = 'Bearer ' + session.access_token;
    }

    const orgId = this.organization;
    if (orgId) {
      result['Organization'] = orgId.toString();
    }

    return result;
  }

  protected getRequest = async (path: string, headers: {[key: string]: string} = {}, refreshAuth: boolean = true): Promise<any> => {
    return await this.internalFetch(path, 'GET', undefined, headers, refreshAuth);
  }

  protected postRequest = async (path: string, body?: string, headers: {[key: string]: string} = {}, refreshAuth: boolean = true): Promise<any> => {
    return await this.internalFetch(path, 'POST', body, headers, refreshAuth);
  }

  protected putRequest = async (path: string, body?: string, headers: {[key: string]: string} = {}, refreshAuth: boolean = true): Promise<any> => {
    return await this.internalFetch(path, 'PUT', body, headers, refreshAuth);
  }

  protected deleteRequest = async (path: string, headers: {[key: string]: string} = {}, refreshAuth: boolean = true): Promise<any> => {
    return await this.internalFetch(path, 'DELETE', undefined, headers, refreshAuth);
  }

  private internalFetch = async (path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: string, baseHeaders: {[key: string]: string} = {}, refreshAuth: boolean = true): Promise<any> => {
    const headers = this.getHeaders(baseHeaders);
    const response = await fetch(this.url + path, {
      method,
      headers,
      body,
    });

    if (response.ok) {
      try {
        return await response.json();
      }
      catch (e) {
        return null;
      }
    } else if (refreshAuth && response.status == 401 && headers['Authorization']) {
      await this.refreshSession();
      return await this.internalFetch(path, method, body, baseHeaders, false);
    } else {
      throw new ApiError(response.status, `API Error: ${response.status}`, response)
    }
  }

}
