import { api } from "@/lib/config";
import { IScheduleSong, ISlide, ISlideContent, ISlideTextContent, ISlideTitleContent, ISong } from "@/types"

export class SongsService {

  private url: string;

  constructor() {
    this.url = api.url + '/songs';
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
