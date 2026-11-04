import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import CloudArrowDownIcon from "@heroicons/react/24/solid/CloudArrowDownIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

import { useServices } from "@/hooks/useServices";
import { useDownloadedSongIds } from "@/hooks/use-offline-downloads";
import { ISongWithRole } from "@/types";
import { Button } from "@/components/ui/button";

/**
 * Button signalling a song's offline availability, placed before the row
 * action buttons. Outline with a download icon when not downloaded
 * (click to download); green when downloaded (click — the icon becomes an X
 * on hover — to remove it from the device). Labels are title-only tooltips.
 */
export function SongOfflineButton({ song }: Readonly<{ song: ISongWithRole }>) {
  const { t } = useTranslation("offline");
  const { offlineDownloadsService } = useServices();
  const downloadedIds = useDownloadedSongIds();

  const isDownloaded = downloadedIds.has(song.id);

  if (isDownloaded) {
    return (
      <Button
        type="button"
        size="sm"
        variant="success"
        className="group"
        title={t('actions.remove')}
        onClick={() => {
          toast.promise(offlineDownloadsService.removeSong(song.id), {
            success: t('removed.success'),
            error: t('errors.remove'),
          });
        }}
      >
        <CloudArrowDownIcon className="size-3 group-hover:hidden" aria-hidden />
        <XMarkIcon className="size-3 hidden group-hover:block" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      title={t('actions.download')}
      onClick={() => {
        toast.promise(offlineDownloadsService.downloadSong(song.id), {
          loading: t('downloading'),
          success: t('downloaded.success'),
          error: t('errors.download'),
        });
      }}
    >
      <CloudArrowDownIcon className="size-3" aria-hidden />
    </Button>
  );
}
