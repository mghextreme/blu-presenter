import { useEffect, useState } from "react";
import { useController } from "@/hooks/controller.provider";
import { Button } from "./button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { useTranslation } from "react-i18next";

export default function ModeToggler() {

  const { t } = useTranslation("controller");

  const {
    mode,
    setMode,
    windows,
  } = useController();

  const [anyPartWindow, setAnyPartWindow] = useState<boolean>(false);

  useEffect(() => {
    const partWind = windows.find((w) => w.theme?.extends === 'subtitles');
    setAnyPartWindow(partWind !== undefined);
  }, [windows]);

  return (
    <>
      {(mode == 'slide' || !anyPartWindow) && (
        <Button variant="outline" onClick={() => setMode(mode == 'slide' ? 'part' : 'slide')}>
          {t('mode.mode')}: {t('mode.' + mode)}
        </Button>
      )}
      {(mode == 'part' && anyPartWindow) && (
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => setMode('part')}>
              {t('mode.mode')}: {t('mode.part')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('mode.areYouSure.title')}</DialogTitle>
              <DialogDescription>
                {t('mode.areYouSure.description')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start space-x-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {t('mode.areYouSure.cancel')}
                </Button>
              </DialogClose>
              <Button type="button" onClick={() => setMode('slide')}>
                {t('mode.areYouSure.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
