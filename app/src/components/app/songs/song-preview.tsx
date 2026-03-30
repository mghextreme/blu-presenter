import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ISong } from "@/types";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PreviewWindow } from "@/components/controller/preview-window";
import { Controls } from "@/components/controller/controls";
import { useController } from "@/hooks/useController";
import { useServices } from "@/hooks/useServices";

interface SongPreviewProps {
  getSong: () => ISong;
  getLastFocusedBlock?: () => number;
  getLastFocusedLine?: () => number;
  children?: ReactNode;
}

export function SongPreview({
  getSong,
  getLastFocusedBlock,
  getLastFocusedLine,
  children,
}: SongPreviewProps) {
  const { t } = useTranslation("songs");

  const {
    setScheduleItem,
    setSelection,
  } = useController();

  const {
    songsService,
  } = useServices();

  const [song, setSong] = useState<ISong>();
  const [startBlock, setStartBlock] = useState<number>(0);
  const [startLine, setStartLine] = useState<number>(0);

  const setupSlides = (open: boolean) => {
    if (open) {
      setSong(getSong());
      setStartBlock(getLastFocusedBlock?.() ?? 0);
      setStartLine(getLastFocusedLine?.() ?? 0);
    }
  };

  useEffect(() => {
    if (!song) return;

    let slides = songsService.toScheduleSong(song);
    slides.slides = slides.slides.slice(0, -1);
    setScheduleItem(slides);

    // Each block maps to one slide; slide 0 is blank, so block N = slide N+1.
    // Clamp to valid range (slides include the leading blank).
    const totalSlides = slides.slides.length;
    const targetSlide = Math.min(startBlock + 1, totalSlides - 1);
    const clampedSlide = Math.max(0, targetSlide);

    // Compute the part index within the slide from the editor line index.
    // In toScheduleSong, each block's content[] is built from lyrics lines
    // grouped in pairs of 2. Block 0 also has a title at content[0].
    // The editor line index includes all line types (lyrics, chords, comments),
    // so we count how many lyrics lines precede the focused line to find the
    // right content item (part) within the slide.
    let targetPart = 0;
    const block = song.blocks?.[startBlock];
    if (block?.lines) {
      let lyricsLinesBefore = 0;
      for (let i = 0; i < block.lines.length && i <= startLine; i++) {
        if (block.lines[i].type === 'lyrics' && block.lines[i].content.trim() !== '') {
          lyricsLinesBefore++;
        }
      }
      // Each content item holds 2 lyrics lines, so the part index is ceil-based
      targetPart = Math.max(0, Math.ceil(lyricsLinesBefore / 2) - 1);
      // Block 0 has a title content item at index 0, shift by 1
      if (startBlock === 0) {
        targetPart += 1;
      }
    }

    // Clamp part to valid range within the slide's content
    const slideContent = slides.slides[clampedSlide]?.content;
    if (slideContent && slideContent.length > 0) {
      targetPart = Math.min(targetPart, slideContent.length - 1);
    }

    setSelection({
      slide: clampedSlide,
      part: targetPart,
    });
  }, [song]);

  return (
    <Dialog onOpenChange={setupSlides}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="xl:max-w-xl 2xl:max-w-2xl">
        <DialogTitle className="text-xl mb-2">
          {t('actions.preview')} - {song?.title}
        </DialogTitle>
        <div className="-mt-3 -mx-3">
          <div className="relative m-3 mb-0">
            <PreviewWindow attachControllerMode={true}></PreviewWindow>
          </div>
          <Controls showBlank={false} showLogo={false}></Controls>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('actions.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
