import { QueryClient } from "@tanstack/react-query";

import { PlaylistIntegrationService } from "./playlist-integration.service";

export class YoutubeService extends PlaylistIntegrationService {

  constructor(queryClient: QueryClient, config: { url: string }) {
    super(queryClient, config, 'youtube');
  }

}
