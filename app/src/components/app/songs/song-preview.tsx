import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ISong } from "@/types";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PreviewWindow } from "@/components/controller/preview-window";
import { Controls } from "@/components/controller/controls";
import { useController } from "@/hooks/useController";
import { useServices } from "@/hooks/services.provider";

interface SongPreviewProps {
  getSong: () => ISong;
  children?: ReactNode;
}

export function SongPreview({
  getSong,
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

  const setupSlides = (open: boolean) => {
    if (open) {
      setSong(getSong());
    }
  };

  useEffect(() => {
    if (!song) return;

    let slides = songsService.toScheduleSong(song);
    slides.slides = slides.slides.slice(0, -1);
    setScheduleItem(slides);
    setSelection({
      slide: 0,
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
