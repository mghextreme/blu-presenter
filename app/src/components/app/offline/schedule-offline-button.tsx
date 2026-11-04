import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import CloudArrowDownIcon from "@heroicons/react/24/solid/CloudArrowDownIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

import { useServices } from "@/hooks/useServices";
import { useDownloadedScheduleIds } from "@/hooks/use-offline-downloads";
import { ISchedule } from "@/types";
import { Button } from "@/components/ui/button";

/**
 * Button signalling a schedule's offline availability (downloading a
 * schedule includes its songs and the themes). Same interaction as the song
 * button: outline + download icon to download, green when downloaded, X on
 * hover to remove. Labels are title-only tooltips.
 */
export function ScheduleOfflineButton({ schedule }: Readonly<{ schedule: ISchedule }>) {
  const { t } = useTranslation("offline");
  const { offlineDownloadsService } = useServices();
  const downloadedIds = useDownloadedScheduleIds();

  const isDownloaded = downloadedIds.has(schedule.id);

  if (isDownloaded) {
    return (
      <Button
        type="button"
        size="sm"
        variant="success"
        className="group"
        title={t('actions.remove')}
        onClick={() => {
          toast.promise(offlineDownloadsService.removeSchedule(schedule.id), {
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
        toast.promise(offlineDownloadsService.downloadSchedule(schedule.id), {
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
