import { QueryClient, queryOptions } from '@tanstack/react-query';

import { ApiService } from './api.service';

/** The current user's connection to a playlist integration (Spotify, YouTube). */
export interface IPlaylistConnectionStatus {
  /** Whether the integration is configured on the server. */
  configured: boolean;
  /** Whether the current user may create/sync playlists. */
  playlistsEnabled: boolean;
  connected: boolean;
  /** The account id on the provider (Spotify user id, YouTube channel id). */
  accountId: string | null;
  accountName: string | null;
  scope: string | null;
}

/**
 * Client for a playlist integration's connection endpoints
 * (`/<provider>/status`, `/<provider>/connect`).
 */
export abstract class PlaylistIntegrationService extends ApiService {
  private readonly provider: string;
  private readonly queryKey: string[];

  constructor(queryClient: QueryClient, config: { url: string }, provider: string) {
    super(queryClient, config);
    this.provider = provider;
    this.queryKey = [provider, 'status'];
  }

  public invalidateCache(): Promise<void> {
    return this.queryClient.invalidateQueries({ queryKey: this.queryKey });
  }

  public async getStatus(): Promise<IPlaylistConnectionStatus> {
    return (await this.getRequest(`/${this.provider}/status`)) as IPlaylistConnectionStatus;
  }

  public getStatusQuery() {
    return queryOptions({
      queryKey: this.queryKey,
      queryFn: async () => await this.getStatus(),
    });
  }

  public async getConnectUrl(): Promise<{ url: string }> {
    return (await this.getRequest(`/${this.provider}/connect`)) as { url: string };
  }

  public async completeConnect(code: string, state: string): Promise<IPlaylistConnectionStatus> {
    const status = (await this.postRequest(
      `/${this.provider}/connect`,
      JSON.stringify({ code, state }),
      {
        'content-type': 'application/json',
      },
    )) as IPlaylistConnectionStatus;
    void this.invalidateCache();
    return status;
  }

  public async disconnect(): Promise<IPlaylistConnectionStatus> {
    const status = (await this.deleteRequest(
      `/${this.provider}/connect`,
    )) as IPlaylistConnectionStatus;
    void this.invalidateCache();
    return status;
  }
}
