import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useController } from "@/hooks/useController";
import { cn } from "@/lib/utils";
import { BaseTheme, IControllerSelection, IScheduleSong, ISlide, ISlideTextContent, ISlideTitleContent, ISongPartLine } from "@/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pairLyricsLines } from "@/lib/songs";

function interleaveLines(chords: string, lyrics: string): ISongPartLine[] {
  const chordLines = chords.split('\n');
  const lyricLines = lyrics.split('\n');
  const maxLength = Math.max(chordLines.length, lyricLines.length);
  const result: ISongPartLine[] = [];

  for (let i = 0; i < maxLength; i++) {
    if (i < chordLines.length) {
      result.push({ type: 'chords', content: chordLines[i] });
    }
    if (i < lyricLines.length) {
      result.push({ type: 'lyrics', content: lyricLines[i] });
    }
  }

  return result;
}

interface PreviewWindowTextFormProps {
  baseTheme: BaseTheme;
}

export function PreviewWindowTextForm({
  baseTheme,
}: PreviewWindowTextFormProps) {

  const { t } = useTranslation("themes");

  const {
    setScheduleItem,
    setMode,
    selection,
  } = useController();

  const [title, setTitle] = useState<string>(t("input.preview.placeholders.title"));
  const [artist, setArtist] = useState<string>(t("input.preview.placeholders.artist"));
  const [lyrics, setLyrics] = useState<string>(t("input.preview.placeholders.lyrics"));
  const [chords, setChords] = useState<string>(t("input.preview.placeholders.chords"));

  const setSong = () => {
    const content: ISlideTextContent[] = [];
    const bits = lyrics.split('\n').map((x) => x.trimEnd());
    for (const part of pairLyricsLines(bits)) {
      content.push({
        type: 'lyrics',
        text: part
      } as ISlideTextContent);
    }

    const scheduleItem = {
      id: 0,
      title,
      artist,
      type: 'song',
      slides: [
        {} as ISlide,
        {
          content: [
            {
              type: 'title',
              title: title,
              subtitle: artist,
            } as ISlideTitleContent,
            ...content,
          ],
        } as ISlide,
        {
          content: [
            {
              type: 'lyrics',
              text: '',
            } as ISlideTextContent
          ],
        } as ISlide,
        {
          content: [...content],
        } as ISlide,
        {} as ISlide,
        { isEmpty: true } as ISlide,
      ],
      blocks: [
        {
          lines: interleaveLines(chords, lyrics),
        },
        {
          lines: chords.split('\n').map(c => ({ type: 'chords' as const, content: c })),
        },
        {
          lines: interleaveLines(chords, lyrics),
        },
      ],
    } as IScheduleSong;

    setScheduleItem(scheduleItem, {
      slide: selection.slide ?? 0,
      part: selection.part ?? 0,
    } as IControllerSelection);
    setMode(baseTheme === 'subtitles' ? 'part' : 'slide');
  }

  useEffect(() => {
    setTimeout(setSong, 100);
  }, []);

  return (
    <div className="flex flex-col gap-3 mt-1">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t("input.preview.title")}</Label>
        <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="artist">{t("input.preview.artist")}</Label>
        <Input name="artist" value={artist} onChange={(e) => setArtist(e.target.value)}  />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lyrics">{t("input.preview.lyrics")}</Label>
        <Textarea name="lyrics" value={lyrics} onChange={(e) => setLyrics(e.target.value)}  className={cn(
          baseTheme === 'teleprompter' && 'font-source-code-pro',
        )} />
      </div>
      {baseTheme === 'teleprompter' && <div className="flex flex-col gap-2">
        <Label htmlFor="chords">{t("input.preview.chords")}</Label>
        <Textarea name="chords" value={chords} onChange={(e) => setChords(e.target.value)}  className="font-source-code-pro" />
      </div>}
      <Button onClick={setSong} className="w-auto me-auto" type="button">{t("input.preview.update")}</Button>
    </div>
  );

}
