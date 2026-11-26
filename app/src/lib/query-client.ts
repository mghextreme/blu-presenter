import { QueryClient } from "@tanstack/react-query";

/**
 * - networkMode 'always': services fall back to the offline store themselves,
 *   so queries and mutations must run while the browser reports offline.
 * - No refetch on focus/reconnect: focus moves between projector windows during
 *   a service, and refetches would reset forms that copy query data into state.
 * - No retry: loaders would otherwise delay error pages (e.g. 404) by retrying.
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always',
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
      },
      mutations: {
        networkMode: 'always',
      },
    },
  });
}
