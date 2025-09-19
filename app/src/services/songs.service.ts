import { ApiService } from "./api.service";
import { IScheduleSong, ISlide, ISlideContent, ISlideTextContent, ISlideTitleContent, ISong, ISongWithRole } from "@/types"

export class SongsService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['songs'] });
  }

  public async getAll(): Promise<ISong[]> {
    return await this.getOrFetch({
      queryKey: ['songs', 'all'],
      queryFn: async () => await this.getRequest('/songs') as ISong[],
    });
  }

  public async getById(songId: number, secret?: string): Promise<ISong | null> {
    const hasSecret = secret && secret.length > 0;
    const secretParam = hasSecret ? `?secret=${secret}` : '';

    return await this.getOrFetch({
      queryKey: ['songs', 'id', songId, hasSecret ? secret : null],
      queryFn: async () => await this.getRequest(`/songs/${songId}${secretParam}`) as ISong,
    });
  }

  public async advancedSearch(
    payload: {
      query: string;
      queryLanguage?: string | undefined;
      organizations?: number[];
      languages?: string[] | undefined;
      searchPublicArchive?: boolean;
      includeBlocks?: boolean;
    }
  ): Promise<ISongWithRole[]> {
    return await this.postRequest('/songs/advancedSearch', JSON.stringify(payload), {
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

      if (ix == 0) {
        content.push({
          type: 'title',
          title: song.title,
          subtitle: song.artist,
        } as ISlideTitleContent);
      }

      const bits = b.text?.split('\n').map((x) => x.trim()) ?? [];
      for (let i = 0; i < bits.length; i += 2) {
        let part = bits[i];

        if (i + 1 < bits.length) {
          part += '\n' + bits[i + 1];
        }

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

}
