import { ISongPart, ISongWithRole, isRoleHigherOrEqualThan, SupportedLanguage } from "@/types";
import { Button } from "@/components/ui/button";
import { Link, useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import i18next from "i18next";
import { useAuth } from "@/hooks/useAuth";
import { SongPreview } from "@/components/app/songs/song-preview";
import { EditSongForm } from "@/components/app/songs/edit-form";
import PreviewIcon from "@/components/icons/preview";
import ControllerProvider from "@/hooks/controller.provider";
import { useRef } from "react";

type EditSongProps = {
  edit?: boolean
  startingBlocks?: ISongPart[]
}

export default function EditSong({
  edit = true,
  startingBlocks,
}: EditSongProps) {

  const { t } = useTranslation("songs");
  const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;
  const { organization } = useAuth();

  const loadedData = useLoaderData() as ISongWithRole;
  if (loadedData) {
    loadedData.blocks = loadedData?.blocks?.map((block, index) => {
      return {
        ...block,
        id: index,
      };
    });
  }
  const data = edit ? loadedData : {
    id: 0,
    title: '',
    language: undefined,
    artist: undefined,
    blocks: startingBlocks ? startingBlocks.map((block, index) => {
      return {
        ...block,
        id: index,
      };
    }) : [{
      id: 0,
      text: '',
      chords: '',
    }],
    references: [],
    organization: organization,
  };

  if (!isRoleHigherOrEqualThan(data.organization?.role, 'guest')) {
    throw new Error(t('error.noPermission'));
  }

  if (!data) {
    throw new Error("Can't find song");
  }

  const formValues = {
    id: data.id,
    language: data.language ?? curLang,
    title: data.title,
    artist: data.artist ?? '',
    blocks: data.blocks ?? [],
    references: data.references ?? [],
  };

  let orgName: string | undefined = t("organizations.publicArchive");
  if (data.organization) {
    orgName = data.organization.name || t("organizations.defaultName");
  }

  const formRef = useRef<typeof EditSongForm>(null);

  return (
    <>
      <title>{(edit ? t('title.edit', { title: data.title, artist: data.artist }) : t('title.add')) + ' - BluPresenter'}</title>
      <div className="flex items-center px-2 sm:px-8 py-3 bg-slate-200 dark:bg-slate-900 gap-x-2">
        <span className="text-sm">{t('input.organization')}: <b>{orgName}</b></span>
        <div className="buttons flex-1 flex justify-end gap-x-2">
          {edit && <>
            <Button
              type="button"
              size="sm"
              title={t('actions.view')}
              asChild>
              <Link to={`/app/songs/${loadedData.id}/view`}>
                <EyeIcon className="size-3" />
              </Link>
            </Button>
          </>}
          <ControllerProvider>
            <SongPreview getSong={() => (formRef.current as any)?.getFormValues()}>
              <Button
                type="button"
                size="sm"
                title={t('actions.preview')}>
                <PreviewIcon className="size-5" />
              </Button>
            </SongPreview>
          </ControllerProvider>
        </div>
      </div>
      <div className="p-2 sm:p-8">
        <h1 className="text-3xl mb-4">{edit ? t('edit.title') : t('add.title')}</h1>
        <EditSongForm edit={edit} formValues={formValues} ref={formRef} />
      </div>
    </>
  );
}
