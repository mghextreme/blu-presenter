import { UseFormReturn, UseFieldArrayRemove, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ISchedule, ISchedulePlaylistReference } from "@/types";
import { PlaylistSyncState } from "./schedule-references";
import { usePlaylistSync } from "./use-playlist-sync";
import { SCHEDULE_PLAYLIST_PROVIDERS } from "./playlist-providers";
import { usePlaylistProviderStatuses } from "./use-playlist-provider-statuses";
import { Button } from "@/components/ui/button";
import { safeExternalUrl } from "@/lib/utils";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/solid/ArrowTopRightOnSquareIcon";

interface EditPlaylistReferenceProps {
  // Generic on purpose: any form with a `references` array field works.
  form: UseFormReturn<any>,
  ix: number,
  remove: UseFieldArrayRemove,
  /** The saved schedule — the sync endpoint re-syncs the playlist from its
   * saved items, so pending-change detection uses this state. */
  schedule: ISchedule,
}

/**
 * Read-only row for a schedule's auto-generated playlist reference: the
 * playlist can be re-synced or removed, but its URL is managed by the app
 * and cannot be edited by hand.
 */
export function EditPlaylistReference({
  form,
  ix,
  remove,
  schedule,
}: Readonly<EditPlaylistReferenceProps>) {
  const { t } = useTranslation("schedules");
  const { t: tSongs } = useTranslation("songs");

  const reference = useWatch({
    control: form.control,
    name: `references.${ix}`,
  }) as ISchedulePlaylistReference | undefined;

  const provider = SCHEDULE_PLAYLIST_PROVIDERS.find(
    (candidate) => !!reference && 'source' in reference && reference.source === candidate.source,
  );

  // Only the creator can sync, so only they need the status.
  const statuses = usePlaylistProviderStatuses(!!reference?.syncedByMe);

  const { isBusy, sync } = usePlaylistSync(schedule, (fresh) => {
    // The sync updated the reference's metadata server-side; mirror it into
    // the form so the row (and the eventual save) stay in sync.
    if (!provider) return;
    const freshReference = provider.findReference(fresh.references);
    if (freshReference) {
      form.setValue(`references.${ix}`, freshReference, { shouldDirty: true });
    }
  });

  if (!provider || !reference) {
    return null;
  }

  const label = reference.name || t(provider.nameKey);
  const hasPendingChanges = reference.tracksHash !== provider.getProjection(schedule).hash;
  // The creator can only sync while the playlist feature is enabled for them.
  const showSyncState = !reference.syncedByMe || !!statuses[provider.source]?.enabled;

  return (
    <li className="flex justify-stretch align-start space-x-2">
      <div className="self-stretch bg-primary text-primary-foreground rounded-md flex flex-col justify-center items-center px-1 min-w-8">
        <span className="text-lg font-bold">{ix + 1}</span>
      </div>
      <div className="flex flex-col w-full flex-1 space-y-2 justify-center">
        <div className="flex space-x-2 items-center">
          <div className="flex items-center justify-center size-9 shrink-0 rounded-md bg-secondary text-secondary-foreground shadow-xs">
            <provider.Icon className="size-4" />
          </div>
          <div className="flex-1 text-sm text-muted-foreground truncate" title={label}>
            {label}
          </div>
          {showSyncState && (
            <PlaylistSyncState
              provider={provider}
              reference={reference}
              hasPendingChanges={hasPendingChanges}
              isBusy={isBusy}
              onSync={() => { void sync(provider); }}
            />
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        disabled={!safeExternalUrl(reference.url)}
        onClick={() => {
          const url = safeExternalUrl(reference.url);
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        }}
      >
        <ArrowTopRightOnSquareIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        title={tSongs('edit.deleteReference')}
        onClick={() => remove(ix)}
      >
        <TrashIcon className="size-4" />
      </Button>
    </li>
  )
}
