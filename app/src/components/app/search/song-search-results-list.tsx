import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
import { useServices } from "@/hooks/useServices";
import { useSearch } from "@/hooks/search.provider";
import { SearchResultsList } from "@/components/app/search/search-results-list";
import { CopySongToOrganization } from "@/components/app/songs/copy-song-to-organization";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function SongSearchResultsList() {

  const { t } = useTranslation("songs");

  const { organizations } = useAuth();
  const orgIndexMap: {[orgId: number]: number} = {};
  for (let i = 0; i < organizations.length; i++) {
    orgIndexMap[organizations[i].id] = i;
  }

  const getButtonOrgIndex = (item: ISongWithRole) => {
    if (!item.organization) {
      return -1;
    }

    return orgIndexMap[item.organization.id];
  }

  const { songsService } = useServices();
  const { refresh } = useSearch();

  const onDeleteSong = async (songId: number) => {
    try {
      await songsService.delete(songId);
      songsService.clearCache();
      refresh();
    } catch (e: any) {
      toast.error(
        t('error.deleteSong'),
      );
    }
  }

  const getButtonActions = (item: ISongWithRole) => {
    const canEdit = isRoleHigherOrEqualThan(item.organization?.role, 'member');
    const canDelete = isRoleHigherOrEqualThan(item.organization?.role, 'admin');

    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.view')}
          asChild>
          <Link to={`/app/songs/${item.id}/view`}>
            <EyeIcon className="size-3" />
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          title={t('actions.edit')}
          asChild={canEdit}
          disabled={!canEdit}>
          {canEdit ? (
            <Link to={`/app/songs/${item.id}/edit`}>
              <PencilIcon className="size-3" />
            </Link>
          ) : (
            <PencilIcon className="size-3" />
          )}
        </Button>
        <CopySongToOrganization songId={item.id} title={item.title} artist={item.artist} variant="default" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="flex-0" variant="destructive" disabled={!canDelete} title={t('actions.delete')}>
              <TrashIcon className="size-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('message.deleteSong.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('message.deleteSong.description', {title: item.title, artist: item.artist})}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDeleteSong(item.id)}>{t('button.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <SearchResultsList getActions={getButtonActions} getColorIndex={getButtonOrgIndex} />
  );
}
