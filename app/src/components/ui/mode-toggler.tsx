import { useEffect, useState } from "react";
import { useController } from "@/hooks/controller.provider";
import { Button } from "./button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";

export default function ModeToggler() {
  const {
    mode,
    setMode,
    windows,
  } = useController();

  const [anyPartWindow, setAnyPartWindow] = useState<boolean>(false);

  useEffect(() => {
    const partWind = windows.find((w) => w.mode == 'part');
    setAnyPartWindow(partWind !== undefined);
  }, [windows]);

  return (
    <>
      {(mode == 'slide' || !anyPartWindow) && (
        <Button onClick={() => setMode(mode == 'slide' ? 'part' : 'slide')}>
          Mode: {mode == 'slide' ? 'Slide' : 'Part'}
        </Button>
      )}
      {(mode == 'part' && anyPartWindow) && (
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => setMode('part')}>
              Mode: Part
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                You have at least one window open with the mode "subtitles".
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start space-x-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" onClick={() => setMode('slide')}>
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
