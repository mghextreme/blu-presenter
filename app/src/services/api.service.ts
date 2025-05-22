import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/types";
import { FetchQueryOptions, QueryClient } from "@tanstack/react-query";

/* eslint-disable @typescript-eslint/no-explicit-any */
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
    await useAuth.getState().refreshSession();
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

  protected getRequest = async (path: string, headers: {[key: string]: string} = {}): Promise<any> => {
    return await this.internalFetch(path, 'GET', undefined, headers);
  }

  protected postRequest = async (path: string, body?: string, headers: {[key: string]: string} = {}): Promise<any> => {
    return await this.internalFetch(path, 'POST', body, headers);
  }

  protected putRequest = async (path: string, body?: string, headers: {[key: string]: string} = {}): Promise<any> => {
    return await this.internalFetch(path, 'PUT', body, headers);
  }

  protected deleteRequest = async (path: string, headers: {[key: string]: string} = {}): Promise<any> => {
    return await this.internalFetch(path, 'DELETE', undefined, headers);
  }

  private internalFetch = async (path: string, method: string, body?: string, baseHeaders: {[key: string]: string} = {}, refreshAuth: boolean = true): Promise<any> => {
    const headers = this.getHeaders(baseHeaders);
    const result = await fetch(this.url + path, {
      method,
      headers,
      body,
    });

    if (result.ok) {
      try {
        return await result.json();
      }
      catch (e) {
        return null;
      }
    } else if (refreshAuth && result.status == 401 && headers['Authorization']) {
      await this.refreshSession();
      return await this.internalFetch(path, method, body, baseHeaders, false);
    } else {
      throw new ApiError(result.status, `API Error: ${result.status}`)
    }
  }

}
