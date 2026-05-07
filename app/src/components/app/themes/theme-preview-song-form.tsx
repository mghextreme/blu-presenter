import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  BaseTheme,
  IControllerSelection,
  ISong,
  ISongPart,
  ISongPartLine,
} from "@/types";
import { SongSchema } from "@/types/schemas/song.schema";
import { useController } from "@/hooks/useController";
import { useServices } from "@/hooks/useServices";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SongEditor } from "@/components/app/songs/song-editor";

interface ThemePreviewSongFormProps {
  baseTheme: BaseTheme;
}

/**
 * Builds default song blocks for the preview by interleaving the chord and
 * lyric placeholder strings from i18n. Lines are paired so chords sit on top
 * of the matching lyric (matching the original PreviewWindowTextForm behavior),
 * but unlike the old form, the user can now use the full SongEditor (parts,
 * comments, transposition, drag, etc.) to drive the preview.
 */
function buildDefaultBlocks(lyrics: string, chords: string): ISongPart[] {
  const lyricLines = lyrics.split('\n');
  const chordLines = chords.split('\n');
  const max = Math.max(lyricLines.length, chordLines.length);
  const lines: ISongPartLine[] = [];
  for (let i = 0; i < max; i++) {
    if (i < chordLines.length && chordLines[i].trim() !== '') {
      lines.push({ type: 'chords', content: chordLines[i] });
    }
    if (i < lyricLines.length) {
      lines.push({ type: 'lyrics', content: lyricLines[i] });
    }
  }
  return [{ lines }];
}

export function ThemePreviewSongForm({ baseTheme }: ThemePreviewSongFormProps) {
  const { t } = useTranslation("themes");

  const { setScheduleItem, setMode, selection } = useController();
  const { songsService } = useServices();

  const defaults = useMemo(() => ({
    id: 0,
    title: t("input.preview.placeholders.title"),
    artist: t("input.preview.placeholders.artist"),
    blocks: buildDefaultBlocks(
      t("input.preview.placeholders.lyrics"),
      t("input.preview.placeholders.chords"),
    ),
    references: [],
  }), [t]);

  const form = useForm<z.infer<typeof SongSchema>>({
    resolver: zodResolver(SongSchema),
    defaultValues: defaults,
  });

  // Push the current form state into the controller as a synthetic schedule song.
  // Debounced so rapid edits don't thrash the preview.
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watched = form.watch();

  useEffect(() => {
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      const song: ISong = {
        id: 0,
        title: watched.title || '',
        artist: watched.artist || undefined,
        blocks: watched.blocks ?? [],
      };
      const scheduleItem = songsService.toScheduleSong(song);
      setScheduleItem(scheduleItem, {
        slide: selection.slide ?? 0,
        part: selection.part ?? 0,
      } as IControllerSelection);
      setMode(baseTheme === 'subtitles' ? 'part' : 'slide');
    }, 200);
    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
    };
    // We deliberately depend on the watched values + baseTheme, not on the
    // controller setters or selection (which change frequently and would loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watched.title, watched.artist, watched.blocks, baseTheme]);

  return (
    <Form {...form}>
      <div className="flex flex-col gap-3 mt-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('input.preview.title')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="artist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('input.preview.artist')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SongEditor form={form} />
      </div>
    </Form>
  );
}
