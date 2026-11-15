import { ApiService } from "./api.service";
import { queryOptions } from "@tanstack/react-query";

export interface ISpotifyConnectionStatus {
  connected: boolean;
  spotifyUserId: string | null;
  spotifyDisplayName: string | null;
  scope: string | null;
}

const QUERY_KEY = ['spotify', 'status'];

export class SpotifyService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: QUERY_KEY });
  }

  public async getStatus(): Promise<ISpotifyConnectionStatus> {
    return await this.getRequest('/spotify/status') as ISpotifyConnectionStatus;
  }

  public getStatusQuery() {
    return queryOptions({
      queryKey: QUERY_KEY,
      queryFn: async () => await this.getStatus(),
    });
  }

  public async getConnectUrl(): Promise<{ url: string }> {
    return await this.getRequest('/spotify/connect') as { url: string };
  }

  public async completeConnect(code: string, state: string): Promise<ISpotifyConnectionStatus> {
    const status = await this.postRequest('/spotify/connect', JSON.stringify({ code, state }), {
      'content-type': 'application/json',
    }) as ISpotifyConnectionStatus;
    this.clearCache();
    return status;
  }

  public async disconnect(): Promise<ISpotifyConnectionStatus> {
    const status = await this.deleteRequest('/spotify/connect') as ISpotifyConnectionStatus;
    this.clearCache();
    return status;
  }

}
