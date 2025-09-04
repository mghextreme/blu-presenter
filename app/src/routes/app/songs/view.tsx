import { useState } from "react";
import { ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
import { Button } from "@/components/ui/button";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { SpotifyCode } from "@/components/app/songs/spotify-code";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import PrinterIcon from "@heroicons/react/24/solid/PrinterIcon";
import ControllerProvider from "@/hooks/controller.provider";
import { SongPreview } from "@/components/app/songs/song-preview";
import { Toggle } from "@/components/ui/toggle";
import { SongEditMode } from "@/components/app/songs/edit-parts";
import Preview from "@/components/icons/preview";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/solid/ArrowTopRightOnSquareIcon";
import { alternateLyricsAndChords } from "@/lib/songs";
import { cn } from "@/lib/utils";
import { CopySongToOrganization } from "@/components/app/songs/copy-song-to-organization";

export default function ViewSong() {

  const { t } = useTranslation("songs");

  const data = useLoaderData() as ISongWithRole;
  const params = useParams();
  const { isLoggedIn } = useAuth();

  if (!data) {
    throw new Error("Can't find song");
  }

  const hasAccess = isRoleHigherOrEqualThan(data.organization?.role, 'guest');
  if (!hasAccess && !!data.secret && params.secret !== data.secret) {
    throw new Error(t('error.noPermission'));
  }

  let orgName: string | undefined = t("organizations.publicArchive");
  if (data.organization) {
    orgName = data.organization.name || t("organizations.defaultName");
  }

  const canEdit = isRoleHigherOrEqualThan(data.organization?.role, 'member');

  const [viewMode, setViewMode] = useState<SongEditMode>('lyrics');
  const changeViewMode = () => {
    if (viewMode === 'lyrics') {
      setViewMode('chords');
    } else {
      setViewMode('lyrics');
    }
  }

  return (
    <>
      <title>{t('title.view', { title: data.title, artist: data.artist }) + ' - BluPresenter'}</title>
      <div className="flex items-center px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{orgName}</b></span>
        <div className="buttons flex-1 flex justify-end gap-x-2">
          <Button
            type="button"
            size="sm"
            title={t('actions.edit')}
            asChild={canEdit}
            disabled={!canEdit}>
            {canEdit ? (
              <Link to={`/app/songs/${data.id}/edit`}>
                <PencilIcon className="size-3" />
              </Link>
            ) : (
              <PencilIcon className="size-3" />
            )}
          </Button>
          {isLoggedIn && <CopySongToOrganization songId={data.id} title={data.title} artist={data.artist} variant="default"></CopySongToOrganization>}
          <Button
            type="button"
            size="sm"
            title={t('actions.print')}
            asChild={true}>
            <Link to={hasAccess ? `/app/songs/${data.id}/print` : `/public/print/${data.id}/${data.secret ?? ''}`}>
              <PrinterIcon className="size-3" />
            </Link>
          </Button>
          {hasAccess && <ControllerProvider>
            <SongPreview getSong={() => data}>
              <Button
                type="button"
                size="sm"
                title={t('actions.preview')}>
                <Preview className="size-5" />
              </Button>
            </SongPreview>
          </ControllerProvider>}
        </div>
      </div>
      <div className="p-8">
        <h1 className="text-3xl mb-2">{data.title}</h1>
        <h2 className="text-lg mb-2 opacity-50">{data.artist}</h2>
        <Toggle variant="outline" pressed={viewMode == 'chords'} onPressedChange={changeViewMode} className="mb-3">{t('input.viewChords')}</Toggle>
        <div className={cn(
          'max-w-lg space-y-3',
          viewMode === 'chords' && 'font-mono'
        )}>
          {data.blocks?.map((block, ix) => (
            <div key={`block-${ix}`} className="border-s-1 ps-[.75em] py-[.2em] min-h-[.75em] whitespace-pre">
              {alternateLyricsAndChords(block.text, viewMode === 'chords' ? block.chords : undefined)}
            </div>
          ))}
        </div>
        {data.references && data.references.length > 0 && <div className="max-w-lg space-y-2 mt-3">
          <h3 className="font-medium text-sm">{t('input.references')}</h3>
          {data.references?.map((reference, ix) => (
            <div className="flex items-center gap-x-2" key={`references-${ix}`}>
              <Button variant="secondary" size="icon" type="button" onClick={() => window.open(reference.url, '_blank')}><ArrowTopRightOnSquareIcon className="size-4" /></Button>
              <div className="flex-1 text-sm text-muted-foreground truncate">
                {reference.name || reference.url}
              </div>
              {reference.url.includes('spotify.com') && (
                <SpotifyCode songUrl={reference.url} imgWidth={320} className="max-w-28" colorScheme="theme" />
              )}
            </div>
          ))}
        </div>}
        {isLoggedIn && <div className="flex flex-row align-start space-x-2 mt-4">
          <Link to={'/app/songs'}><Button className="flex-0" type="button" variant="secondary">{t('button.back')}</Button></Link>
        </div>}
      </div>
    </>
  );
}
