import { useState } from "react";
import { ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
import { Button } from "@/components/ui/button";
import { Link, useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import PrinterIcon from "@heroicons/react/24/solid/PrinterIcon";
import ControllerProvider from "@/hooks/controller.provider";
import { SongPreview } from "@/components/app/songs/song-preview";
import { Toggle } from "@/components/ui/toggle";
import { SongEditMode } from "@/components/app/songs/edit-parts";
import Preview from "@/components/icons/preview";
import ArrowTopRightOnSquareIcon from "@heroicons/react/24/solid/ArrowTopRightOnSquareIcon";

export default function ViewSong() {

  const { t } = useTranslation("songs");

  const data = useLoaderData() as ISongWithRole;

  if (!data) {
    throw new Error("Can't find song");
  }

  if (!isRoleHigherOrEqualThan(data.organization?.role, 'guest')) {
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
          <Button
            type="button"
            size="sm"
            title={t('actions.print')}
            asChild={true}>
            <Link to={`/app/songs/${data.id}/print`}>
              <PrinterIcon className="size-3" />
            </Link>
          </Button>
          <ControllerProvider>
            <SongPreview getSong={() => data}>
              <Button
                type="button"
                size="sm"
                title={t('actions.preview')}>
                <Preview className="size-5" />
              </Button>
            </SongPreview>
          </ControllerProvider>
        </div>
      </div>
      <div className="p-8">
        <h1 className="text-3xl mb-2">{data.title}</h1>
        <h2 className="text-lg mb-2 opacity-50">{data.artist}</h2>
        <Toggle variant="outline" pressed={viewMode == 'chords'} onPressedChange={changeViewMode} className="mb-3">{t('input.viewChords')}</Toggle>
        <div className="max-w-lg space-y-2">
          {data.blocks?.map((block, ix) => (
            <>
              {viewMode === 'chords' ? (
                <div className="flex-1 grid grid-cols-1 grid-rows-1 border-input shadow-xs dark:bg-input/30" key={`chords-${ix}`}>
                  <Textarea variant="invisible" className="col-start-1 row-start-1 pt-5 pb-0 font-mono leading-[3.2em] pointer-events-none text-muted-foreground resize-none" value={block.text} />
                  <Textarea variant="transparent" className="col-start-1 row-start-1 pt-0 pb-5 font-mono leading-[3.2em] min-h-full resize-none" value={block.chords} />
                </div>
              ) : (
                <Textarea className="flex-1 resize-none" value={block.text} key={`text-${ix}`} />
              )}
            </>
          ))}
        </div>
        {data.references && <div className="max-w-lg space-y-2 mt-3">
          <h3 className="font-medium text-sm">{t('input.references')}</h3>
          {data.references?.map((reference, ix) => (
            <div className="flex items-center gap-x-2" key={`references-${ix}`}>
              <Button variant="secondary" size="icon" type="button" onClick={() => window.open(reference.url, '_blank')}><ArrowTopRightOnSquareIcon className="size-4" /></Button>
              <div className="flex-1 text-sm text-muted-foreground truncate">
                {reference.name || reference.url}
              </div>
            </div>
          ))}
        </div>}
        <div className="flex flex-row align-start space-x-2 mt-4">
          <Link to={'/app/songs'}><Button className="flex-0" type="button" variant="secondary">{t('button.back')}</Button></Link>
        </div>
      </div>
    </>
  );
}
