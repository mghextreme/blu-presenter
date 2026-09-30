import { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useServices } from "@/hooks/useServices";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import ArrowDownTrayIcon from "@heroicons/react/24/solid/ArrowDownTrayIcon";
import ClipboardDocumentIcon from "@heroicons/react/24/solid/ClipboardDocumentIcon";

interface ExportSongDialogProps {
  songId: number;
  title: string;
  artist?: string;
  secret?: string;
  variant?: "default" | "secondary";
}

export function ExportSongDialog({ songId, title, artist, secret, variant = "secondary" }: Readonly<ExportSongDialogProps>) {

  const { t } = useTranslation("songs");
  const { songsService } = useServices();

  const [open, setOpen] = useState<boolean>(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const exportFilename = `${slugify(`${artist ?? ''}-${title}`) || `song-${songId}`}.md`;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      return;
    }

    setText(null);
    setLoading(true);
    songsService.exportSong(songId, secret)
      .then((result) => setText(result))
      .catch((e) => {
        toast.error(t('error.export'), {
          description: e?.message || '',
        });
        setOpen(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const copyToClipboard = async () => {
    const clipboard = navigator.clipboard;
    if (!!clipboard && !!text) {
      await clipboard.writeText(text);
      toast.success(t('message.export.copiedTitle'), {
        description: t('message.export.copiedDescription'),
      });
    }
  }

  const downloadExport = () => {
    if (!text) {
      return;
    }

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFilename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant} title={t('actions.export')}>
          <ArrowDownTrayIcon className="size-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('message.export.title')}</DialogTitle>
          <DialogDescription>
            <span className="block mb-2">{t('message.export.songDescription', { title: title, artist: artist })}</span>
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[50vh] overflow-auto rounded-md border bg-muted/50 p-4 font-mono text-xs whitespace-pre">
          {loading ? t('message.export.loading') : text}
        </pre>
        <DialogFooter>
          <Button type="button" disabled={!text} onClick={downloadExport}>
            <ArrowDownTrayIcon className="size-3" />
            {t('button.download')}
          </Button>
          <Button type="button" variant="outline" disabled={!text} onClick={copyToClipboard}>
            <ClipboardDocumentIcon className="size-3" />
            {t('button.copy')}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">{t('actions.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
