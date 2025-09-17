import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table"
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { IOrganization, isRoleHigherOrEqualThan, ITheme } from "@/types";
import { Button } from "@/components/ui/button";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { useServices } from "@/hooks/services.provider";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const buildColumns = (t: TFunction, organization: IOrganization | null, onDeleteTheme: (themeId: number) => void) => {
  const columns: ColumnDef<ITheme>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.name')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "extends",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.baseTheme')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
      cell: ({ row }) => {
        return <>{t(`theme.${row.original.extends}`)}</>;
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const canDelete = isRoleHigherOrEqualThan(organization?.role, 'admin');
        const canEdit = isRoleHigherOrEqualThan(organization?.role, 'member');
        return (
          <div className="flex justify-end space-x-2 -m-1">
            <Button
              type="button"
              size="sm"
              title={t('actions.edit')}
              disabled={!canEdit}
              asChild>
              <Link to={`/app/themes/${row.original.id}/edit`}>
                <PencilIcon className="size-3" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="flex-0" variant="destructive" disabled={!canDelete} title={t('actions.delete')}>
                  <TrashIcon className="size-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('message.deleteTheme.title')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('message.deleteTheme.description', {name: row.original.name})}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => onDeleteTheme(row.original.id)}>{t('button.confirm')}</AlertDialogAction>
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

export default function Themes() {

  const { t } = useTranslation("themes");
  const { organization } = useAuth();

  const data = useLoaderData() as ITheme[];
  const { revalidate } = useRevalidator();
  const { themesService } = useServices();

  const onDeleteTheme = async (songId: number) => {
    try {
      await themesService.delete(songId);
      themesService.clearCache();
      revalidate();
    } catch (e: any) {
      toast.error(
        t('error.deleteTheme'),
      );
    }
  }

  const columns = buildColumns(t, organization, onDeleteTheme);

  useEffect(() => {
    themesService.clearCache();
    revalidate();
  }, [organization]);

  return (
    <div className="p-8">
      <title>{t('title.list', {organization: organization?.name || t('organizations.defaultName')}) + ' - BluPresenter'}</title>
      <h1 className="text-3xl mb-2">{t('list.title')}</h1>
      <h2 className="text-lg mb-4 opacity-50">{organization?.name || t('organizations.defaultName')}</h2>
      <DataTable columns={columns} data={data ?? []} addButton={(
        <>
          <Button asChild><Link to="/app/themes/add">{t('actions.create')}</Link></Button>
        </>
      )}></DataTable>
    </div>
  );
}
