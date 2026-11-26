import { queryOptions } from '@tanstack/react-query';
import { ApiService } from './api.service';
import { ISession } from '@/types';

export interface SessionSearchPayload {
  query?: string;
  organizations?: number[];
  page?: number;
  itemsPerPage?: number;
}

const sessionKeys = {
  all: ['sessions'] as const,
  detail: (sessionId: number) => ['sessions', 'id', sessionId] as const,
  allForUser: ['sessions', 'allForUser'] as const,
  shared: (orgId: number, sessionId: number, secret?: string) =>
    ['sessions', 'shared', orgId, sessionId, secret || null] as const,
  search: (payload: SessionSearchPayload) => ['sessions', 'search', payload] as const,
};

export class SessionsService extends ApiService {
  public invalidateCache(): Promise<void> {
    return this.queryClient.invalidateQueries({ queryKey: sessionKeys.all });
  }

  public searchQuery(payload: SessionSearchPayload) {
    return queryOptions({
      queryKey: sessionKeys.search(payload),
      queryFn: async () =>
        (await this.postRequest('/sessions/search', JSON.stringify(payload), {
          'content-type': 'application/json',
        })) as ISession[],
    });
  }

  public async search(payload: SessionSearchPayload): Promise<ISession[]> {
    return await this.queryClient.query(this.searchQuery(payload));
  }

  public allForUserQuery() {
    return queryOptions({
      queryKey: sessionKeys.allForUser,
      queryFn: async () => (await this.getRequest('/sessions/user/all')) as ISession[],
    });
  }

  public async getAllForUser(): Promise<ISession[]> {
    return await this.queryClient.query(this.allForUserQuery());
  }

  public bySecretQuery(orgId: number, sessionId: number, secret?: string) {
    const params = new URLSearchParams();
    if (secret && secret.length > 0) {
      params.append('secret', secret);
    }

    return queryOptions({
      queryKey: sessionKeys.shared(orgId, sessionId, secret),
      queryFn: async () =>
        (await this.getRequest(
          `/sessions/org/${orgId}/${sessionId}?${params.toString()}`,
        )) as ISession,
    });
  }

  public async getBySecret(orgId: number, sessionId: number, secret?: string): Promise<ISession> {
    return await this.queryClient.query(this.bySecretQuery(orgId, sessionId, secret));
  }

  public byIdQuery(sessionId: number) {
    return queryOptions({
      queryKey: sessionKeys.detail(sessionId),
      queryFn: async () => (await this.getRequest(`/sessions/${sessionId}`)) as ISession | null,
    });
  }

  public async getById(sessionId: number): Promise<ISession | null> {
    return await this.queryClient.query(this.byIdQuery(sessionId));
  }

  public async add(value: ISession, orgId: number): Promise<ISession | null> {
    const response = (await this.postRequest('/sessions', JSON.stringify(value), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as ISession;
    void this.invalidateCache();
    return response;
  }

  public async update(id: number, value: ISession, orgId: number): Promise<ISession | null> {
    const response = (await this.putRequest(`/sessions/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as ISession;
    void this.invalidateCache();
    return response;
  }

  public async delete(sessionId: number, orgId: number): Promise<void> {
    await this.deleteRequest(`/sessions/${sessionId}`, {
      Organization: orgId.toString(),
    });
    this.queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
    void this.invalidateCache();
  }
}
