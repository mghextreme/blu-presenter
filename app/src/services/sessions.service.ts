import { ApiService } from "./api.service";
import { ISession, ITheme } from "@/types"

export class SessionsService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['sessions'] });
  }

  public async getAll(): Promise<ISession[]> {
    return await this.getOrFetch({
      queryKey: ['sessions', 'all'],
      queryFn: async () => await this.getRequest('/sessions') as ITheme[],
    });
  }

  public async getAllForUser(): Promise<ISession[]> {
    return await this.getOrFetch({
      queryKey: ['sessions', 'allForUser'],
      queryFn: async () => await this.getRequest('/sessions/user/all') as ISession[],
    });
  }

  public async add(value: ISession): Promise<ISession | null> {
    const response = await this.postRequest('/sessions', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISession;
    this.clearCache();
    return response;
  }

  public async update(id: number, value: ITheme): Promise<ISession | null> {
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
