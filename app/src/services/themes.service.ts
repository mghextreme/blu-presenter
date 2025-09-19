import { ApiService } from "./api.service";
import { ITheme } from "@/types"

export class ThemesService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['themes'] });
  }

  public async getAll(): Promise<ITheme[]> {
    return await this.getOrFetch({
      queryKey: ['themes', 'all'],
      queryFn: async () => await this.getRequest('/themes') as ITheme[],
    });
  }

  public async getAllForUser() {
    return await this.getOrFetch({
      queryKey: ['themes', 'allForUser'],
      queryFn: async () => await this.getRequest('/themes/user/all') as ITheme[],
    });
  }

  public async getById(themeId: number): Promise<ITheme | null> {
    return await this.getOrFetch({
      queryKey: ['themes', 'id', themeId],
      queryFn: async () => await this.getRequest(`/themes/${themeId}`) as ITheme,
    });
  }

  public async add(value: ITheme): Promise<ITheme | null> {
    const response = await this.postRequest('/themes', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ITheme;
    this.clearCache();
    return response;
  }

  public async update(id: number, value: ITheme): Promise<ITheme | null> {
    const response = await this.putRequest(`/themes/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ITheme;
    this.clearCache();
    return response;
  }

  public async delete(themeId: number): Promise<void> {
    await this.deleteRequest(`/themes/${themeId}`);
    this.clearCache();
  }

  public async copyToOrganization(id: number, toOrganizationId: number): Promise<void> {
    await this.postRequest('/themes/copyToOrganization', JSON.stringify({
      themeId: id,
      organizationId: toOrganizationId,
    }), {
      'content-type': 'application/json',
    });
  }

}
