import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table"
import { format, parse } from "date-fns";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import { IOrganization, ISchedule, isRoleHigherOrEqualThan } from "@/types";
import { Button } from "@/components/ui/button";
import { getLocaleConfig } from "@/components/ui/date-picker";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { useServices } from "@/hooks/useServices";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const buildColumns = (t: TFunction, lang: string, organization: IOrganization | null, onDeleteSchedule: (scheduleId: number) => void) => {
  const canManage = isRoleHigherOrEqualThan(organization?.role, 'member');
  const { dateFns, formatStr } = getLocaleConfig(lang);

  const columns: ColumnDef<ISchedule>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('column.title')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('column.date')} />
      ),
      cell: ({ row }) => {
        const date = row.original.date;
        if (!date) return '';
        const parsed = parse(date, "yyyy-MM-dd", new Date());
        return format(parsed, formatStr, { locale: dateFns });
      },
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end space-x-2 -m-1">
            <Button
              type="button"
              size="sm"
              title={t('actions.view')}
              asChild>
              <Link to={`/app/schedules/${row.original.id}/view`}>
                <EyeIcon className="size-3" />
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              title={t('actions.edit')}
              disabled={!canManage}
              asChild>
              <Link to={`/app/schedules/${row.original.id}/edit`}>
                <PencilIcon className="size-3" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="flex-0" variant="destructive" disabled={!canManage} title={t('actions.delete')}>
                  <TrashIcon className="size-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('message.deleteSchedule.title')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('message.deleteSchedule.description', { name: row.original.title })}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => onDeleteSchedule(row.original.id)}>{t('button.confirm')}</AlertDialogAction>
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

export function Schedules() {

  const { t, i18n } = useTranslation("schedules");
  const { organization } = useAuth();

  const data = useLoaderData() as ISchedule[];
  const { revalidate } = useRevalidator();
  const { schedulesService } = useServices();

  const onDeleteSchedule = async (scheduleId: number) => {
    try {
      await schedulesService.delete(scheduleId);
      schedulesService.clearCache();
      revalidate();
    } catch (e: any) {
      toast.error(
        t('error.deleteSchedule'),
      );
    }
  }

  const lang = i18n.language?.substring(0, 2) ?? "en";
  const columns = buildColumns(t, lang, organization, onDeleteSchedule);

  useEffect(() => {
    schedulesService.clearCache();
    revalidate();
  }, [organization]);

  return (
    <div className="p-2 sm:p-8">
      <title>{t('title.list', { organization: organization?.name || t('organizations.defaultName') }) + ' - BluPresenter'}</title>
      <h1 className="text-3xl mb-2">{t('list.title')}</h1>
      <h2 className="text-lg mb-4 opacity-50">{organization?.name || t('organizations.defaultName')}</h2>
      <DataTable columns={columns} data={data ?? []} addButton={(
        <>
          <Button asChild><Link to="/app/schedules/add">{t('actions.create')}</Link></Button>
        </>
      )}></DataTable>
    </div>
  );
}
