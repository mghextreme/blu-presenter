import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { ApiService } from './api.service';
import { secretQuery } from './secret-query';
import {
  IScheduleItem,
  IScheduleSong,
  IScheduleText,
  ISlide,
  ISlideContent,
  ISlideTextContent,
  ISlideTitleContent,
  ISong,
  ISongWithRole,
} from '@/types';
import { pairLyricsLines } from '@/lib/songs';
import { PAGE_SIZE } from '@/lib/pagination';
import { getOfflineSongById, searchOfflineSongs } from '@/lib/offline/reads';

export interface SongSearchPayload {
  query?: string;
  queryLanguage?: string;
  organizations?: number[];
  languages?: string[];
  searchPublicArchive?: boolean;
  includeBlocks?: boolean;
  page?: number;
  itemsPerPage?: number;
}

export type SongSearchFilters = Omit<SongSearchPayload, 'page' | 'itemsPerPage'>;

const songKeys = {
  all: ['songs'] as const,
  detail: (songId: number, secret?: string) => ['songs', 'id', songId, secret || null] as const,
  export: (songId: number, secret?: string) => ['songs', 'export', songId, secret || null] as const,
  search: (payload: SongSearchPayload) => ['songs', 'search', payload] as const,
  searchPages: (filters: SongSearchFilters) => ['songs', 'search', 'pages', filters] as const,
};

export class SongsService extends ApiService {
  public invalidateCache(): Promise<void> {
    return this.queryClient.invalidateQueries({ queryKey: songKeys.all });
  }

  public byIdQuery(songId: number, secret?: string) {
    return queryOptions({
      queryKey: songKeys.detail(songId, secret),
      queryFn: () =>
        this.withOfflineFallback(
          async () =>
            (await this.getRequest(
              `/songs/${songId}${secretQuery(secret)}`,
            )) as ISongWithRole | null,
          () => getOfflineSongById(songId),
        ),
    });
  }

  public async getById(songId: number, secret?: string): Promise<ISongWithRole | null> {
    return await this.queryClient.query(this.byIdQuery(songId, secret));
  }

  /** Requests the song from the API even when a fresh copy is cached. */
  public async fetchById(songId: number): Promise<ISongWithRole | null> {
    return await this.fetchFresh(this.byIdQuery(songId));
  }

  public exportQuery(songId: number, secret?: string) {
    return queryOptions({
      queryKey: songKeys.export(songId, secret),
      queryFn: async () =>
        await this.getTextRequest(`/songs/${songId}/export${secretQuery(secret)}`),
    });
  }

  public async importText(text: string, orgId: number): Promise<ISong | null> {
    const response = (await this.postRequest('/songs/importText', JSON.stringify({ text }), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as ISong;
    void this.invalidateCache();
    return response;
  }

  private requestSearch(payload: SongSearchPayload): Promise<ISongWithRole[]> {
    return this.withOfflineFallback(
      async () =>
        (await this.postRequest('/songs/search', JSON.stringify(payload), {
          'content-type': 'application/json',
        })) as ISongWithRole[],
      () => searchOfflineSongs(payload),
    );
  }

  public searchQuery(payload: SongSearchPayload) {
    return queryOptions({
      queryKey: songKeys.search(payload),
      queryFn: () => this.requestSearch(payload),
    });
  }

  public async search(payload: SongSearchPayload): Promise<ISongWithRole[]> {
    return await this.queryClient.query(this.searchQuery(payload));
  }

  /** Search results loaded page by page (`PAGE_SIZE` songs each). */
  public searchPagesQuery(filters: SongSearchFilters) {
    return infiniteQueryOptions({
      queryKey: songKeys.searchPages(filters),
      queryFn: ({ pageParam }) =>
        this.requestSearch({ ...filters, page: pageParam, itemsPerPage: PAGE_SIZE }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    });
  }

  public async searchPages(filters: SongSearchFilters) {
    return await this.queryClient.infiniteQuery(this.searchPagesQuery(filters));
  }

  public async add(value: ISong, orgId: number): Promise<ISong | null> {
    const response = (await this.postRequest('/songs', JSON.stringify(value), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as ISong;
    void this.invalidateCache();
    return response;
  }

  public async copyToOrganization(
    id: number,
    toOrganizationId: number,
    sourceOrgId: number,
  ): Promise<void> {
    await this.postRequest(
      '/songs/copyToOrganization',
      JSON.stringify({
        songId: id,
        organizationId: toOrganizationId,
      }),
      {
        'content-type': 'application/json',
        Organization: sourceOrgId.toString(),
      },
    );
    void this.invalidateCache();
  }

  public async update(id: number, value: ISong, orgId: number): Promise<ISong | null> {
    const response = (await this.putRequest(`/songs/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
      Organization: orgId.toString(),
    })) as ISong;
    void this.invalidateCache();
    return response;
  }

  public async delete(songId: number, orgId: number): Promise<void> {
    await this.deleteRequest(`/songs/${songId}`, {
      Organization: orgId.toString(),
    });
    this.queryClient.removeQueries({ queryKey: ['songs', 'id', songId] });
    void this.invalidateCache();
  }

  public toScheduleSong(song: ISong): IScheduleSong {
    const slides =
      song.blocks?.map((b, ix) => {
        const content: ISlideContent[] = [];

        if (ix === 0) {
          content.push({
            type: 'title',
            title: song.title,
            subtitle: song.artist,
          } as ISlideTitleContent);
        }

        const lyricsLines =
          b.lines?.filter((line) => line.type === 'lyrics').map((line) => line.content.trim()) ??
          [];

        for (const part of pairLyricsLines(lyricsLines)) {
          content.push({
            type: 'lyrics',
            text: part,
          } as ISlideTextContent);
        }

        return {
          content,
        } as ISlide;
      }) ?? [];

    return {
      type: 'song',
      ...song,
      slides: [{}, ...slides, {}],
    } as IScheduleSong;
  }

  public toScheduleText(item: { title?: string; subtitle?: string }): IScheduleText {
    return {
      id: Date.now(),
      type: 'text',
      title: item.title,
      subtitle: item.subtitle,
      slides: [
        {},
        {
          content: [
            {
              type: 'title',
              title: item.title,
              subtitle: item.subtitle,
            } as ISlideTitleContent,
          ],
        },
        {},
      ],
    } as IScheduleText;
  }

  public toScheduleComment(item: { title?: string }): IScheduleItem {
    return {
      id: Date.now(),
      type: 'comment',
      title: item.title,
      slides: [{ isEmpty: true }],
    } as IScheduleItem;
  }

  public resolveScheduleItems(items: IScheduleItem[]): IScheduleItem[] {
    return items.map((item) => {
      if (item.type === 'song') {
        return this.toScheduleSong(item as ISong);
      }
      if (item.type === 'text') {
        return this.toScheduleText(item as IScheduleText);
      }
      if (item.type === 'comment') {
        return this.toScheduleComment(item);
      }
      return item;
    });
  }
}
