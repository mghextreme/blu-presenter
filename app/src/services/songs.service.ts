import { IScheduleSong, ISlide, ISlideContent, ISlideTextContent, ISlideTitleContent, ISong } from "@/types"

export class SongsService {

  private url: string;

  constructor(config: { url: string }) {
    this.url = config.url + '/songs';
  }

  public async getAll(): Promise<ISong[]> {
    const response = await fetch(this.url + '/');
    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result as ISong[];
  }

  public async getById(songId: number): Promise<ISong | null> {
    const response = await fetch(this.url + `/${songId}`);
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result as ISong;
  }

  public async search(query: string): Promise<ISong[]> {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(this.url + `/search/${encodedQuery}`);
    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    return result as ISong[];
  }

  public async add(value: ISong): Promise<ISong | null> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result as ISong;
  }

  public async update(id: number, value: ISong): Promise<ISong | null> {
    const response = await fetch(this.url + `/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(value),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result as ISong;
  }

  public async delete(songId: number): Promise<void> {
    const response = await fetch(this.url + `/${songId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      return;
    }

    return;
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
