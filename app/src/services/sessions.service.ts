import { ApiService } from "./api.service";
import { ISession } from "@/types"

export class SessionsService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['sessions'] });
  }

  public async getAll(): Promise<ISession[]> {
    return await this.getOrFetch({
      queryKey: ['sessions', 'all'],
      queryFn: async () => await this.getRequest('/sessions') as ISession[],
    });
  }

  public async getAllForUser(): Promise<ISession[]> {
    return await this.getOrFetch({
      queryKey: ['sessions', 'allForUser'],
      queryFn: async () => await this.getRequest('/sessions/user/all') as ISession[],
    });
  }

  public async getBySecret(
    orgId: number,
    sessionId: number,
    secret?: string,
  ) {
    const params = new URLSearchParams();
    if (secret && secret.length > 0) {
      params.append('secret', secret);
    }

    return await this.getOrFetch({
      queryKey: ['sessions', sessionId],
      queryFn: async () => await this.getRequest(`/sessions/org/${orgId}/${sessionId}?${params.toString()}`) as ISession,
    });
  }

  public async getById(sessionId: number): Promise<ISession | null> {
    return await this.getOrFetch({
      queryKey: ['sessions', 'id', sessionId],
      queryFn: async () => await this.getRequest(`/sessions/${sessionId}`) as ISession,
    });
  }

  public async add(value: ISession): Promise<ISession | null> {
    const response = await this.postRequest('/sessions', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISession;
    this.clearCache();
    return response;
  }

  public async update(id: number, value: ISession): Promise<ISession | null> {
    const response = await this.putRequest(`/sessions/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISession;
    this.clearCache();
    return response;
  }

  public async delete(sessionId: number): Promise<void> {
    await this.deleteRequest(`/sessions/${sessionId}`);
    this.clearCache();
  }

}
