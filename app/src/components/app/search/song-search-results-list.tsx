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
import { toast } from "sonner";

export function SongSearchResultsList() {

  const { t } = useTranslation("songs");

  const { songsService } = useServices();
  const { refresh } = useSearch();

  const onDeleteSong = async (song: ISongWithRole) => {
    if (!song.organization?.id) {
      return;
    }

    try {
      await songsService.delete(song.id, song.organization.id);
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
    const canDelete = isRoleHigherOrEqualThan(item.organization?.role, 'admin')
      && !!item.organization?.id;

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
        <CopySongToOrganization songId={item.id} title={item.title} artist={item.artist} sourceOrgId={item.organization?.id} variant="default" />
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
              <AlertDialogAction variant="destructive" onClick={() => onDeleteSong(item)}>{t('button.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <SearchResultsList getActions={getButtonActions} />
  );
}
