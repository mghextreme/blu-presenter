import { ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
import { SongsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Link, Params, useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import ControllerProvider from "@/hooks/controller.provider";
import { SongPreview } from "@/components/app/songs/song-preview";
import Preview from "@/components/icons/preview";

export async function loader({ params, songsService }: { params: Params, songsService: SongsService }) {
  return await songsService.getById(Number(params.id));
}

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
        <div className="max-w-lg space-y-2">
          {data.blocks?.map((block) => (
            <Textarea value={block.text} className="resize-none" />
          ))}
        </div>
        <div className="flex flex-row align-start space-x-2 mt-4">
          <Link to={'/app/songs'}><Button className="flex-0" type="button" variant="secondary">{t('button.back')}</Button></Link>
        </div>
      </div>
    </>
  );
}
