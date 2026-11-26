import { queryOptions } from "@tanstack/react-query";
import { ApiService } from "./api.service";
import { ITheme } from "@/types"
import { mergeTheme } from "@/lib/theme-config";
import { getOfflineThemeById, getOfflineThemes, searchOfflineThemes } from "@/lib/offline/reads";

export interface ThemeSearchPayload {
  query?: string;
  organizations?: number[];
  page?: number;
  itemsPerPage?: number;
}

const themeKeys = {
  all: ['themes'] as const,
  detail: (themeId: number) => ['themes', 'id', themeId] as const,
  allForUser: ['themes', 'allForUser'] as const,
  forSession: (orgId: number, sessionId: number, secret?: string, theme?: number) => ['themes', 'session', orgId, sessionId, secret || null, theme ?? null] as const,
  search: (payload: ThemeSearchPayload) => ['themes', 'search', payload] as const,
};

export class ThemesService extends ApiService {

  public invalidateCache(): Promise<void> {
    return this.queryClient.invalidateQueries({ queryKey: themeKeys.all });
  }

  public searchQuery(payload: ThemeSearchPayload) {
    return queryOptions({
      queryKey: themeKeys.search(payload),
      queryFn: () => this.withOfflineFallback(
        async () => (await this.postRequest('/themes/search', JSON.stringify(payload), {
          'content-type': 'application/json',
        }) as ITheme[]).map(mergeTheme),
        () => searchOfflineThemes(payload),
      ),
    });
  }

  public async search(payload: ThemeSearchPayload): Promise<ITheme[]> {
    return await this.queryClient.query(this.searchQuery(payload));
  }

  public allForUserQuery() {
    return queryOptions({
      queryKey: themeKeys.allForUser,
      queryFn: () => this.withOfflineFallback(
        async () => (await this.getRequest('/themes/user/all') as ITheme[]).map(mergeTheme),
        () => getOfflineThemes(),
      ),
    });
  }

  public async getAllForUser(): Promise<ITheme[]> {
    return await this.queryClient.query(this.allForUserQuery());
  }

  /** Requests the themes from the API even when a fresh copy is cached. */
  public async fetchAllForUser(): Promise<ITheme[]> {
    return await this.fetchFresh(this.allForUserQuery());
  }

  public forSessionQuery(orgId: number, sessionId: number, secret?: string, theme?: number) {
    const params = new URLSearchParams();
    if (secret && secret.length > 0) {
      params.append('secret', secret);
    }
    if (theme && theme > 0) {
      params.append('theme', theme.toString());
    }

    return queryOptions({
      queryKey: themeKeys.forSession(orgId, sessionId, secret, theme),
      queryFn: async () => (await this.getRequest(`/themes/session/${orgId}/${sessionId}?${params.toString()}`) as ITheme[]).map(mergeTheme),
    });
  }

  public async getBySessionSecret(orgId: number, sessionId: number, secret?: string, theme?: number): Promise<ITheme[]> {
    return await this.queryClient.query(this.forSessionQuery(orgId, sessionId, secret, theme));
  }

  public byIdQuery(themeId: number) {
    return queryOptions({
      queryKey: themeKeys.detail(themeId),
      queryFn: () => this.withOfflineFallback(
        async () => {
          const theme = await this.getRequest(`/themes/${themeId}`) as ITheme | null;
          return theme ? mergeTheme(theme) : null;
        },
        () => getOfflineThemeById(themeId),
      ),
    });
  }

  public async getById(themeId: number): Promise<ITheme | null> {
    return await this.queryClient.query(this.byIdQuery(themeId));
  }

  public async add(value: ITheme, orgId: number): Promise<ITheme | null> {
    const response = await this.postRequest('/themes', JSON.stringify(value), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    }) as ITheme;
    void this.invalidateCache();
    return response;
  }

  public async update(id: number, value: ITheme, orgId: number): Promise<ITheme | null> {
    const response = await this.putRequest(`/themes/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    }) as ITheme;
    void this.invalidateCache();
    return response;
  }

  public async delete(themeId: number, orgId: number): Promise<void> {
    await this.deleteRequest(`/themes/${themeId}`, {
      'Organization': orgId.toString(),
    });
    this.queryClient.removeQueries({ queryKey: themeKeys.detail(themeId) });
    void this.invalidateCache();
  }

  public async copyToOrganization(id: number, toOrganizationId: number, sourceOrgId: number): Promise<void> {
    await this.postRequest('/themes/copyToOrganization', JSON.stringify({
      themeId: id,
      organizationId: toOrganizationId,
    }), {
      'content-type': 'application/json',
      'Organization': sourceOrgId.toString(),
    });
    void this.invalidateCache();
  }

}
