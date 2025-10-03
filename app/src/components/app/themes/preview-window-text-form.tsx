import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useController } from "@/hooks/controller.provider";
import { cn } from "@/lib/utils";
import { BaseTheme, IControllerSelection, IScheduleSong, ISlide, ISlideTextContent, ISlideTitleContent } from "@/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
    const bits = lyrics.split('\n').map((x) => x.trimEnd()) ?? [];
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
          text: lyrics,
          chords: chords,
        },
        {
          chords: chords,
        },
        {
          text: lyrics,
          chords: chords,
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
