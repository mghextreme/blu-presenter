import { ISongPart, ISongWithRole, isRoleHigherOrEqualThan, SupportedLanguage } from "@/types";
import { Button } from "@/components/ui/button";
import { Link, useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import i18next from "i18next";
import { useAuth } from "@/hooks/useAuth";
import { SongPreview } from "@/components/app/songs/song-preview";
import { EditSongForm, EditSongFormHandle } from "@/components/app/songs/edit-form";
import { OrganizationBar, OptionalOrganization } from "@/components/app/organization-bar";
import { PageTitle } from "@/components/shared/page-title";
import { PageContent } from "@/components/shared/page-content";
import { PreviewIcon } from "@/components/icons/preview";
import { ControllerProvider } from "@/hooks/controller.provider";
import { useRef } from "react";

interface EditSongProps {
  edit?: boolean
  startingBlocks?: ISongPart[]
}

export function EditSong({
  edit = true,
  startingBlocks,
}: EditSongProps) {

  const { t } = useTranslation("songs");
  const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;
  const { organization, organizations } = useAuth();

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
      lines: [],
    }],
    references: [],
    organization: undefined,
  };

  if (!data) {
    throw new Error("Can't find song");
  }

  const organizationsToAddTo = organizations.filter(
    (org) => isRoleHigherOrEqualThan(org.role, 'member')
  );

  const [selectedOrganizations, setSelectedOrganizations] = useState<OptionalOrganization[]>(() => {
    if (edit) {
      return [data.organization ?? null];
    }

    const initial = organizationsToAddTo.find((org) => org.id === organization?.id)
      ?? organizationsToAddTo[0];
    return initial ? [initial] : [];
  });

  if (edit && !isRoleHigherOrEqualThan(data.organization?.role, 'guest')) {
    throw new Error(t('error.noPermission'));
  }

  if (!edit && organizationsToAddTo.length === 0) {
    throw new Error(t('error.noPermission'));
  }

  const organizationId = edit ? data.organization?.id : selectedOrganizations[0]?.id;

  const formValues = {
    id: data.id,
    language: data.language ?? curLang,
    title: data.title,
    artist: data.artist ?? '',
    blocks: data.blocks ?? [],
    references: data.references ?? [],
  };

  const formRef = useRef<EditSongFormHandle>(null);

  return (
    <>
      <title>{(edit ? t('title.edit', { title: data.title, artist: data.artist }) : t('title.add')) + ' - BluPresenter'}</title>
      <PageTitle value={edit ? t('edit.title') : t('add.title')} />
      <OrganizationBar
        organizations={edit ? [data.organization ?? null] : organizationsToAddTo}
        selected={selectedOrganizations}
        editable={!edit}
        subtitle={edit ? undefined : t('add.to')}
        onOrganizationsChange={setSelectedOrganizations}
      >
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
          <SongPreview
            getSong={() => formRef.current?.getFormValues()}
            getLastFocusedBlock={() => formRef.current?.getLastFocusedBlock() ?? 0}
            getLastFocusedLine={() => formRef.current?.getLastFocusedLine() ?? 0}
          >
            <Button
              type="button"
              size="sm"
              title={t('actions.preview')}>
              <PreviewIcon className="size-5" />
            </Button>
          </SongPreview>
        </ControllerProvider>
      </OrganizationBar>
      <PageContent>
        <EditSongForm edit={edit} formValues={formValues} organizationId={organizationId} ref={formRef} />
      </PageContent>
    </>
  );
}
