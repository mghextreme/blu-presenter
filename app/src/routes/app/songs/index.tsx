import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table"
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import { IOrganization, ISong, isRoleHigherOrEqualThan } from "@/types";
import { CopySongToOrganization } from "@/components/app/songs/copy-song-to-organization";
import { Button } from "@/components/ui/button";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { SongsService } from "@/services";
import { useServices } from "@/hooks/services.provider";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export async function loader({ songsService }: { songsService: SongsService }) {
  return await songsService.getAll();
}

const buildColumns = (t: TFunction, organization: IOrganization | null, onDeleteSong: (songId: number) => void) => {
  const columns: ColumnDef<ISong>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.title')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "artist",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.artist')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const canDelete = isRoleHigherOrEqualThan(organization?.role ?? 'member', 'admin');
        const canEdit = isRoleHigherOrEqualThan(organization?.role ?? 'member', 'member');
        return (
          <div className="flex justify-end space-x-2 -m-1">
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                title={t('actions.edit')}
                asChild>
                <Link to={`/app/songs/${row.original.id}/edit`}>
                  <PencilIcon className="size-3" />
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                title={t('actions.view')}
                asChild>
                <Link to={`/app/songs/${row.original.id}/view`}>
                  <EyeIcon className="size-3" />
                </Link>
              </Button>
            )}
            <CopySongToOrganization songId={row.original.id} title={row.original.title} artist={row.original.artist}></CopySongToOrganization>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="flex-0" variant="destructive" disabled={!canDelete} title={t('actions.delete')}>
                  <TrashIcon className="size-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('message.deleteSong.title')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('message.deleteSong.description', {title: row.original.title, artist: row.original.artist})}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => onDeleteSong(row.original.id)}>{t('button.confirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      }
    },
  ];

  return columns;
}

export default function Songs() {

  const { t } = useTranslation("songs");
  const { organization } = useAuth();

  const data = useLoaderData() as ISong[];
  const { revalidate } = useRevalidator();
  const { songsService } = useServices();

  const onDeleteSong = async (songId: number) => {
    try {
      await songsService.delete(songId);
      songsService.clearCache();
      revalidate();
    } catch (e: any) {
      toast.error(
        t('error.deleteSong'),
      );
    }
  }

  const columns = buildColumns(t, organization, onDeleteSong);

  useEffect(() => {
    songsService.clearCache();
    revalidate();
  }, [organization]);

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-2">{t('list.title')}</h1>
      <h2 className="text-lg mb-4 opacity-50">{organization?.name || t('organizations.defaultName')}</h2>
      <DataTable columns={columns} data={data ?? []} addButton={(
        <Link to="/app/songs/add"><Button>{t('actions.create')}</Button></Link>
      )}></DataTable>
    </div>
  );
}
