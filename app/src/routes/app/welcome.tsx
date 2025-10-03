/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { useServices } from "@/hooks/useServices";
import { IOrganizationInvitation } from "@/types";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { ColumnDef } from "@tanstack/react-table";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useLoaderData, useRevalidator } from "react-router-dom";
import { toast } from "sonner";

const buildColumns = (t: TFunction, acceptInvitation: (id: number) => void, rejectInvitation: (id: number) => void) => {
  const columns: ColumnDef<IOrganizationInvitation>[] = [
    {
      accessorKey: "organization.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.orgName')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.role')} />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role");
        return (
          t('role.' + role)
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end space-x-2 -m-1">
            <Button
              type="button"
              size="sm"
              title={t('actions.accept')}
              onClick={() => acceptInvitation(row.original.id)}>
              <CheckIcon className="size-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              title={t('actions.reject')}
              onClick={() => rejectInvitation(row.original.id)}>
              <TrashIcon className="size-3" />
            </Button>
          </div>
        )
      }
    },
  ];

  return columns;
}

export default function Welcome() {

  const { t } = useTranslation('app');

  const data = useLoaderData() as IOrganizationInvitation[] || [];

  const { revalidate } = useRevalidator();
  
  const { organizationsService } = useServices();

  const acceptInvitation = async (invitationId: number) => {
    try {
      await organizationsService.acceptInvitation(invitationId);
      revalidate();

      toast.success(t('message.acceptInvitation.title'), {
        description: t('message.acceptInvitation.description'),
      });
    }
    catch (e: any) {
      toast.error(t('error.acceptInvitation.title'), {
        description: e?.message ?? '',
      });
    }
  }

  const rejectInvitation = async (invitationId: number) => {
    try {
      await organizationsService.rejectInvitation(invitationId);
      revalidate();

      toast.success(t('message.rejectInvitation.title'));
    }
    catch (e: any) {
      toast.error(t('error.rejectInvitation.title'), {
        description: e?.message ?? '',
      });
    }
  }

  const columns = buildColumns(t, acceptInvitation, rejectInvitation);

  return (
    <div className="p-2 sm:p-8">
      <title>{t('welcome.message') + ' - BluPresenter'}</title>
      <h1 className="text-3xl">{t('welcome.message')}</h1>
      {data.length > 0 && (
        <>
          <h2 className="text-xl mt-6 mb-4">{t('invitations.title')}</h2>
          <DataTable columns={columns} data={data ?? []}></DataTable>
        </>
      )}
    </div>
  );
}
