import { ApiService } from "./api.service";
import { IScheduleItem, IScheduleSong, IScheduleText, ISlide, ISlideContent, ISlideTextContent, ISlideTitleContent, ISong, ISongWithRole } from "@/types"
import { pairLyricsLines } from "@/lib/songs";

export class SongsService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['songs'] });
  }

  public async getById(songId: number, secret?: string): Promise<ISong | null> {
    const hasSecret = secret && secret.length > 0;
    const secretParam = hasSecret ? `?secret=${secret}` : '';

    return await this.getOrFetch({
      queryKey: ['songs', 'id', songId, hasSecret ? secret : null],
      queryFn: async () => await this.getRequest(`/songs/${songId}${secretParam}`) as ISong,
    });
  }

  public async search(
    payload: {
      query?: string | undefined;
      queryLanguage?: string | undefined;
      organizations?: number[];
      languages?: string[] | undefined;
      searchPublicArchive?: boolean;
      includeBlocks?: boolean;
      page?: number;
      itemsPerPage?: number;
    }
  ): Promise<ISongWithRole[]> {
    return await this.postRequest('/songs/search', JSON.stringify(payload), {
      'content-type': 'application/json',
    }) as ISongWithRole[];
  }

  public async add(value: ISong): Promise<ISong | null> {
    const response = await this.postRequest('/songs', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISong;
    this.clearCache();
    return response;
  }

  public async copyToOrganization(id: number, toOrganizationId: number): Promise<void> {
    await this.postRequest('/songs/copyToOrganization', JSON.stringify({
      songId: id,
      organizationId: toOrganizationId,
    }), {
      'content-type': 'application/json',
    });
  }

  public async update(id: number, value: ISong): Promise<ISong | null> {
    const response = await this.putRequest(`/songs/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISong;
    this.clearCache();
    return response;
  }

  public async delete(songId: number): Promise<void> {
    await this.deleteRequest(`/songs/${songId}`);
    this.clearCache();
  }

  public toScheduleSong(song: ISong): IScheduleSong {
    const slides = song.blocks?.map((b, ix) => {
      const content: ISlideContent[] = [];

      if (ix === 0) {
        content.push({
          type: 'title',
          title: song.title,
          subtitle: song.artist,
        } as ISlideTitleContent);
      }

      const lyricsLines = b.lines
        ?.filter(line => line.type === 'lyrics')
        .map(line => line.content.trim()) ?? [];

      for (const part of pairLyricsLines(lyricsLines)) {
        content.push({
          type: 'lyrics',
          text: part
        } as ISlideTextContent);
      }

      return {
        content,
      } as ISlide;
    }) ?? [];

    return {
      type: 'song',
      ...song,
      slides: [
        {},
        ...slides,
        {},
      ],
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
