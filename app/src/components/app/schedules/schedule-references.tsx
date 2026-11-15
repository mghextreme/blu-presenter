import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import {
  ISchedule,
  ISchedulePlaylistReference,
  ISongReference,
  isRoleHigherOrEqualThan,
} from "@/types";
import { useServices } from "@/hooks/useServices";
import { ReferencePlayer } from "@/components/app/songs/reference-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import {
  SCHEDULE_PLAYLIST_PROVIDERS,
  SchedulePlaylistProvider,
} from "./playlist-providers";
import { usePlaylistSync } from "./use-playlist-sync";

interface ScheduleReferencesProps {
  schedule: ISchedule;
  /** Called with the refreshed schedule after a playlist was created or re-synced. */
  onSynced: (schedule: ISchedule) => void;
}

/**
 * The schedule view's references section: the shared reference rows plus the
 * auto-generated playlist providers — one row per provider (to create its
 * playlist) and the up-to-date / re-sync state on each generated playlist's
 * row.
 */
export function ScheduleReferences({
  schedule,
  onSynced,
}: Readonly<ScheduleReferencesProps>) {
  const { t } = useTranslation("schedules");
  const { isBusy, connect, sync } = usePlaylistSync(schedule, onSynced);

  const [createFor, setCreateFor] = useState<SchedulePlaylistProvider | null>(null);
  const [playlistName, setPlaylistName] = useState('');

  const canManage =
    !!schedule.organization &&
    isRoleHigherOrEqualThan(schedule.organization.role, 'member');

  const hasReferences = !!schedule.references?.length;

  // Managers see the section even without references, so they can add a
  // generated playlist; everyone else only sees it when there is one.
  if (!canManage && !hasReferences) {
    return null;
  }

  const defaultName = schedule.date
    ? `${schedule.title} — ${schedule.date}`
    : schedule.title;

  const openCreate = (provider: SchedulePlaylistProvider) => {
    setPlaylistName(defaultName);
    setCreateFor(provider);
  };

  const syncAndClose = async (provider: SchedulePlaylistProvider, name?: string) => {
    const success = await sync(provider, name);
    if (success) {
      setCreateFor(null);
    }
  };

  return (
    <div className="mt-6">
      <ReferencePlayer
        references={schedule.references ?? []}
        renderRowActions={canManage ? ((reference) => (
          <ReferenceRowActions
            schedule={schedule}
            reference={reference}
            isBusy={isBusy}
            onSync={(provider) => { void syncAndClose(provider); }}
            onConnect={connect}
          />
        )) : undefined}
      >
        {canManage && SCHEDULE_PLAYLIST_PROVIDERS.filter(
          (provider) => !provider.findReference(schedule.references),
        ).map((provider) => (
          <ProviderRow
            key={provider.source}
            provider={provider}
            schedule={schedule}
            isBusy={isBusy}
            onCreate={openCreate}
            onConnect={connect}
          />
        ))}
      </ReferencePlayer>

      <Dialog open={!!createFor} onOpenChange={(open) => { if (!open) setCreateFor(null); }}>
        {createFor && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t(`${createFor.i18nPrefix}.create`)}</DialogTitle>
              <DialogDescription>
                {t(`${createFor.i18nPrefix}.createDescription`, {
                  count: createFor.getProjection(schedule).trackIds.length,
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('input.title')}</label>
              <Input
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder={defaultName}
                maxLength={255}
              />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setCreateFor(null)}>
                {t('button.cancel')}
              </Button>
              <Button
                disabled={isBusy || !playlistName.trim()}
                onClick={() => { void syncAndClose(createFor, playlistName.trim()); }}
              >
                {isBusy && <ArrowPathIcon className="size-4 me-2 animate-spin" />}
                {t(`${createFor.i18nPrefix}.createConfirm`)}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

/** Whether the user's account is connected to a provider's service, or
 * undefined while the status is loading. One case per provider. */
function useProviderConnection(
  provider: SchedulePlaylistProvider,
  enabled: boolean,
): boolean | undefined {
  const { spotifyService } = useServices();

  switch (provider.source) {
    case 'spotify-auto': {
      const { data } = useQuery({
        ...spotifyService.getStatusQuery(),
        enabled,
        retry: false,
      });
      return data?.connected;
    }
    default:
      throw new Error(`No connection status for schedule playlist provider: ${provider.source}`);
  }
}

interface ProviderRowProps {
  provider: SchedulePlaylistProvider;
  schedule: ISchedule;
  isBusy: boolean;
  /** Opens the create dialog for a provider. */
  onCreate: (provider: SchedulePlaylistProvider) => void;
  /** Starts the OAuth connect flow for a provider. */
  onConnect: (provider: SchedulePlaylistProvider) => void;
}

/** Row for a provider that doesn't have a reference on the schedule yet: the
 * service's logo and name, plus its create (or connect) action. */
function ProviderRow({
  provider,
  schedule,
  isBusy,
  onCreate,
  onConnect,
}: Readonly<ProviderRowProps>) {
  const { t } = useTranslation("schedules");
  const isConnected = useProviderConnection(provider, true);

  const hasSongs = provider.getProjection(schedule).trackIds.length > 0;

  return (
    <div className="flex items-center gap-x-2">
      <div className="flex items-center justify-center size-9 shrink-0 rounded-md bg-secondary text-secondary-foreground shadow-xs">
        <provider.Icon className="size-4" />
      </div>
      <div className="flex-1 text-sm text-muted-foreground truncate">
        {t(provider.nameKey)}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={isBusy || isConnected === undefined || (isConnected && !hasSongs)}
        title={isConnected === true && !hasSongs ? t(`${provider.i18nPrefix}.noSongs`) : undefined}
        onClick={() => (isConnected ? onCreate(provider) : onConnect(provider))}
      >
        {isConnected === false
          ? t(`${provider.i18nPrefix}.connect`)
          : t(`${provider.i18nPrefix}.create`)}
      </Button>
    </div>
  );
}

interface ReferenceRowActionsProps {
  schedule: ISchedule;
  reference: ISongReference;
  isBusy: boolean;
  onSync: (provider: SchedulePlaylistProvider) => void;
  onConnect: (provider: SchedulePlaylistProvider) => void;
}

/** Extra row content for auto-generated playlist references — the sync state
 * of the provider's playlist. Renders nothing for plain references. */
function ReferenceRowActions({
  schedule,
  reference,
  isBusy,
  onSync,
  onConnect,
}: Readonly<ReferenceRowActionsProps>) {
  const canManage =
    !!schedule.organization &&
    isRoleHigherOrEqualThan(schedule.organization.role, 'member');

  const provider = SCHEDULE_PLAYLIST_PROVIDERS.find(
    (candidate) => candidate.findReference(schedule.references) === reference,
  );

  if (!provider || !canManage) {
    return null;
  }

  return (
    <AutoReferenceState
      provider={provider}
      reference={provider.findReference(schedule.references)!}
      schedule={schedule}
      isBusy={isBusy}
      onSync={onSync}
      onConnect={onConnect}
    />
  );
}

interface AutoReferenceStateProps {
  provider: SchedulePlaylistProvider;
  reference: ISchedulePlaylistReference;
  schedule: ISchedule;
  isBusy: boolean;
  onSync: (provider: SchedulePlaylistProvider) => void;
  onConnect: (provider: SchedulePlaylistProvider) => void;
}

/** The sync state of a generated playlist on the view page: a connect prompt
 * when the creator has disconnected their account, otherwise the shared
 * re-sync state. */
function AutoReferenceState({
  provider,
  reference,
  schedule,
  isBusy,
  onSync,
  onConnect,
}: Readonly<AutoReferenceStateProps>) {
  const { t } = useTranslation("schedules");
  const isConnected = useProviderConnection(provider, true);

  // Wait for the connection status before rendering anything.
  if (isConnected === undefined) {
    return null;
  }

  // The creator disconnected their account: reconnect to re-enable syncing.
  if (!isConnected && reference.syncedByMe) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={isBusy}
        onClick={() => onConnect(provider)}
      >
        <provider.Icon className="size-4 me-1" />
        {t(`${provider.i18nPrefix}.connect`)}
      </Button>
    );
  }

  const projection = provider.getProjection(schedule);

  return (
    <PlaylistSyncState
      provider={provider}
      reference={reference}
      hasPendingChanges={reference.tracksHash !== projection.hash}
      isBusy={isBusy}
      onSync={() => onSync(provider)}
    />
  );
}

interface PlaylistSyncStateProps {
  provider: SchedulePlaylistProvider;
  reference: ISchedulePlaylistReference;
  hasPendingChanges: boolean;
  isBusy: boolean;
  onSync: () => void;
}

/** The sync state of a generated playlist: an icon button matching the rows'
 * other icon buttons — a check when up to date, a re-sync arrow when the
 * schedule changed since the last sync — or a read-only note for playlists
 * managed by someone else. The label lives in the tooltip. */
export function PlaylistSyncState({
  provider,
  reference,
  hasPendingChanges,
  isBusy,
  onSync,
}: Readonly<PlaylistSyncStateProps>) {
  const { t } = useTranslation("schedules");
  const prefix = provider.i18nPrefix;

  // Somebody else's playlist: read-only.
  if (!reference.syncedByMe) {
    return (
      <span
        className="text-sm text-muted-foreground inline-flex items-center gap-1"
        title={t(`${prefix}.managedByTooltip`, {
          name: reference.syncedByName ?? '',
        })}
      >
        <provider.Icon className="size-4" />
        {t(`${prefix}.managedBy`, { name: reference.syncedByName ?? '' })}
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant={hasPendingChanges ? 'default' : 'outline'}
      disabled={isBusy}
      title={hasPendingChanges ? t(`${prefix}.resyncTooltip`) : t(`${prefix}.upToDate`)}
      aria-label={hasPendingChanges ? t(`${prefix}.resync`) : t(`${prefix}.upToDate`)}
      onClick={onSync}
    >
      {isBusy ? (
        <ArrowPathIcon className="size-4 animate-spin" />
      ) : hasPendingChanges ? (
        <ArrowPathIcon className="size-4" />
      ) : (
        <CheckIcon className="size-4" />
      )}
    </Button>
  );
}
