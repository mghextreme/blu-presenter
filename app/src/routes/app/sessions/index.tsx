import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table"
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { IOrganization, ISession, isRoleHigherOrEqualThan } from "@/types";
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

const buildColumns = (t: TFunction, organization: IOrganization | null, onDeleteSession: (themeId: number) => void) => {
  const canManage = isRoleHigherOrEqualThan(organization?.role, 'admin');

  const getSessionName = (session: ISession) => {
    if (session.default) {
      return t('session.defaultName');
    }
    return session.name;
  }

  const columns: ColumnDef<ISession>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.name')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
      cell: ({ row }) => {
        return getSessionName(row.original);
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end space-x-2 -m-1">
            <Button
              type="button"
              size="sm"
              title={t('actions.edit')}
              disabled={!canManage}
              asChild>
              <Link to={`/app/sessions/${row.original.id}/edit`}>
                <PencilIcon className="size-3" />
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" className="flex-0" variant="destructive" disabled={!canManage || row.original.default} title={t('actions.delete')}>
                  <TrashIcon className="size-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('message.deleteSession.title')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('message.deleteSession.description', {name: getSessionName(row.original)})}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => onDeleteSession(row.original.id)}>{t('button.confirm')}</AlertDialogAction>
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

export default function Sessions() {

  const { t } = useTranslation("sessions");
  const { organization } = useAuth();

  const data = useLoaderData() as ISession[];
  const { revalidate } = useRevalidator();
  const { sessionsService } = useServices();

  const onDeleteSession = async (sessionId: number) => {
    try {
      await sessionsService.delete(sessionId);
      sessionsService.clearCache();
      revalidate();
    } catch (e: any) {
      toast.error(
        t('error.deleteSession'),
      );
    }
  }

  const columns = buildColumns(t, organization, onDeleteSession);

  useEffect(() => {
    sessionsService.clearCache();
    revalidate();
  }, [organization]);

  return (
    <div className="p-2 sm:p-8">
      <title>{t('title.list', {organization: organization?.name || t('organizations.defaultName')}) + ' - BluPresenter'}</title>
      <h1 className="text-3xl mb-2">{t('list.title')}</h1>
      <h2 className="text-lg mb-4 opacity-50">{organization?.name || t('organizations.defaultName')}</h2>
      <DataTable columns={columns} data={data ?? []} addButton={(
        <>
          <Button asChild><Link to="/app/sessions/add">{t('actions.create')}</Link></Button>
        </>
      )}></DataTable>
    </div>
  );
}
