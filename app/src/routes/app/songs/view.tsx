import { ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
import { Button } from "@/components/ui/button";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import PrinterIcon from "@heroicons/react/24/solid/PrinterIcon";
import ShareIcon from "@heroicons/react/24/solid/ShareIcon";
import { ControllerProvider } from "@/hooks/controller.provider";
import { SongPreview } from "@/components/app/songs/song-preview";
import { PreviewIcon } from "@/components/icons/preview";
import { CopySongToOrganization } from "@/components/app/songs/copy-song-to-organization";
import { SongViewer } from "@/components/app/songs/song-viewer";
import { OrganizationBar } from "@/components/app/organization-bar";
import { toast } from "sonner";

export function ViewSong() {

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

  const canEdit = isRoleHigherOrEqualThan(data.organization?.role, 'member');

  const copyShareableUrlToClipboard = async () => {
    const currentUrl = new URL(window.location.href);
    const shareUrl = `${currentUrl.protocol}//${currentUrl.host}/shared/view/${data.id}/${data.secret ?? ''}`
    const clipboard = navigator.clipboard;
    if (!!clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('message.share.title'), {
        description: t('message.share.description'),
      });
    } else {
      window.open(shareUrl, '_blank');
    }
  }

  return (
    <>
      <title>{t('title.view', { title: data.title, artist: data.artist }) + ' - BluPresenter'}</title>
      <OrganizationBar organizations={[data.organization]}>
        {isLoggedIn && <CopySongToOrganization songId={data.id} title={data.title} artist={data.artist} variant="default" />}
        <Button
          type="button"
          size="sm"
          title={t('actions.share')}
          onClick={copyShareableUrlToClipboard}>
          <ShareIcon className="size-3" />
        </Button>
        <Button
          type="button"
          size="sm"
          title={t('actions.print')}
          asChild>
          <Link to={hasAccess ? `/app/songs/${data.id}/print` : `/shared/print/${data.id}/${data.secret ?? ''}`}>
            <PrinterIcon className="size-3" />
          </Link>
        </Button>
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
        {hasAccess && <ControllerProvider>
          <SongPreview getSong={() => data}>
            <Button
              type="button"
              size="sm"
              title={t('actions.preview')}>
              <PreviewIcon className="size-5" />
            </Button>
          </SongPreview>
        </ControllerProvider>}
      </OrganizationBar>
      <SongViewer song={data} />
      {isLoggedIn && <div className="flex flex-row align-start space-x-2 px-2 sm:px-8 pb-8">
        <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app/songs'}>{t('button.back')}</Link></Button>
      </div>}
    </>
  );
}
