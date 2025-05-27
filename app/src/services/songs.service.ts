import { ApiService } from "./api.service";
import { IScheduleSong, ISlide, ISlideContent, ISlideTextContent, ISlideTitleContent, ISong } from "@/types"

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

  public async getById(songId: number): Promise<ISong | null> {
    return await this.getOrFetch({
      queryKey: ['songs', 'id', songId],
      queryFn: async () => await this.getRequest(`/songs/${songId}`) as ISong,
    });
  }

  public async search(query: string): Promise<ISong[]> {
    return await this.getOrFetch({
      queryKey: ['songs', 'search', query],
      queryFn: async () => {
        const encodedQuery = encodeURIComponent(query);
        return await this.getRequest(`/songs/search/${encodedQuery}`) as ISong[];
      }
    });
  }

  public async add(value: ISong): Promise<ISong | null> {
    const response = await this.postRequest('/songs', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as ISong;
    this.clearCache();
    return response;
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
      ...song,
      slides: [
        {},
        ...slides,
        {},
      ],
    } as IScheduleSong;
  }

}
