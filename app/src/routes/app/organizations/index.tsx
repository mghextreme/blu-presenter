import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OrganizationsService } from "@/services";
import { useServices } from "@/hooks/services.provider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { IOrganization } from "@/types/organization.interface";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable, fuzzyFilter, fuzzySort } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/column-header";
import { TFunction } from "i18next";
import { IOrganizationInvitation, IOrganizationUser, OrganizationRoleOptions, isRoleHigherThan, isRoleHigherOrEqualThan } from "@/types";
import { useOrganization } from "@/hooks/useOrganization";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export async function loader({ organizationsService }: { organizationsService: OrganizationsService }) {
  return await organizationsService.getCurrent();
}

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
});

type EditOrganizationProps = {
  edit?: boolean
}

const buildColumns = (t: TFunction, userEmail: string | undefined, userRole: OrganizationRoleOptions, organizationsService: OrganizationsService) => {
  const columns: ColumnDef<IOrganizationUser>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.name')} />
      ),
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.email')} />
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
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex justify-end space-x-2 -m-1">
            {isRoleHigherOrEqualThan(userRole ?? 'member', 'admin') && (
              <>
                <Link to={`/app/organization/member/${row.original.id}`}>
                  <Button
                    type="button"
                    size="sm"
                    title={t('actions.editMember')}>
                    <PencilIcon className="size-3" />
                  </Button>
                </Link>
                {isRoleHigherOrEqualThan(userRole ?? 'member', row.original.role) && row.original.email != userEmail && (
                  <Button
                    size="sm"
                    variant="destructive"
                    title={t('actions.removeMember')}
                    onClick={() => organizationsService.removeMember(row.original.id)}>
                    <TrashIcon className="size-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        )
      }
    },
  ];

  return columns;
}

const buildInvitationColumns = (t: TFunction, userEmail: string | undefined, userRole: OrganizationRoleOptions | undefined, organizationsService: OrganizationsService) => {
  const columns: ColumnDef<IOrganizationInvitation>[] = [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.email')} />
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
      filterFn: fuzzyFilter,
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "inviter",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('input.invitedBy')} />
      ),
      cell: ({ row }) => {
        const name = row.original.inviter?.name ?? '';
        const email = row.original.inviter?.email;
        return (
          <>
            {name}
            {email && (
              <span className="opacity-50 ms-1">({email.toString()})</span>
            )}
          </>
        );
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
              size="sm"
              title={t('actions.copyLink')}
              onClick={() => organizationsService.cancelInvitation(row.original.id)}>
              <ClipboardCopyIcon className="size-3" />
            </Button>
            {isRoleHigherOrEqualThan(userRole ?? 'member', 'admin') && (
              <Button
                size="sm"
                variant="destructive"
                title={t('actions.removeInvitation')}
                disabled={userRole !== 'owner' && userEmail !== row.original.inviter.email}
                onClick={() => organizationsService.cancelInvitation(row.original.id)}>
                <TrashIcon className="size-3" />
              </Button>
            )}
          </div>
        )
      }
    },
  ];

  return columns;
}

export default function EditOrganization({
  edit = true
}: EditOrganizationProps) {

  const { t } = useTranslation("organizations");

  const loadedData = useLoaderData() as IOrganization;
  const data = edit ? loadedData : {
    id: 0,
    name: '',
  };

  const isPersonalSpace = edit && (data.name == null || data?.name == '');

  const navigate = useNavigate();
  const { revalidate } = useRevalidator();

  const { organizationId, setOrganizationId } = useOrganization();
  const { user } = useAuth();
  const { organizationsService } = useServices();

  if (!data) {
    throw new Error("Can't find organization");
  }

  const [isLoading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data.id,
      name: data.name,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      let action;
      if (edit) {
        action = organizationsService.update({
          ...values,
        });
      } else {
        action = organizationsService.add({
          ...values,
        });
      }
      action
        .then((result: IOrganization | null) => {
          if (!edit && result) {
            setOrganizationId(result.id);
          }
          organizationsService.clearCache();
          navigate("/app/organization", { replace: true });
        })
        .catch((err) => {
          console.error(err);
        })
    } finally {
      setLoading(false);
    }
  }

  const onDeleteOrganization = async () => {
    try {
      setLoading(true);
      alert('Confirm delete?');
      await organizationsService.delete();
      organizationsService.clearCache();
      navigate("/app", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  const columns = buildColumns(t, user?.email, loadedData?.role, organizationsService);
  const invitationColumns = buildInvitationColumns(t, user?.email, loadedData?.role, organizationsService);

  useEffect(() => {
    if (edit) {
      organizationsService.clearCache();
      revalidate();
    }
  }, [organizationId, revalidate]);

  useEffect(() => {
    form.setValue('id', data.id);
    form.setValue('name', data?.name ?? '');
  }, [loadedData]);

  return (
    <div className="p-8">
      {isPersonalSpace ? (
        <Alert>
          <AlertTitle>{t('warning.personalSpace.title')}</AlertTitle>
          <AlertDescription>
            {t('warning.personalSpace.message')}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <h1 className="text-3xl mb-4">{t(edit ? 'edit.title' : 'add.title')}</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('input.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={edit && isPersonalSpace} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}></FormField>
              <div className="flex flex-row align-start space-x-2">
                {!isPersonalSpace && isRoleHigherThan(loadedData.role ?? 'member', 'member') && (
                  <Button className="flex-0" type="submit" disabled={isLoading}>
                    {isLoading && (
                      <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                    )}
                    {t('button.' + (edit ? 'update' : 'add'))}
                    </Button>
                )}
                <Link to={'/app/organization'}><Button className="flex-0" type="button" variant="secondary">{t('button.cancel')}</Button></Link>
              </div>
            </form>
          </Form>
          {edit && (
            <>
              <h2 className="text-xl mt-6 mb-4">{t('edit.members')}</h2>
              <DataTable columns={columns} data={loadedData.users ?? []} addButton={(
                <Link to={`/app/organization/invite`}><Button>{t('actions.inviteMember')}</Button></Link>
              )}></DataTable>
              {(loadedData?.invitations?.length ?? 0) > 0 && (
                <>
                  <h2 className="text-xl mt-6 mb-4">{t('edit.pendingInvitations')}</h2>
                  <DataTable columns={invitationColumns} data={loadedData.invitations ?? []}></DataTable>
                </>
              )}
            </>
          )}
          {edit && loadedData.role == 'owner' && (
            <>
              <h2 className="text-xl mt-6 mb-4">{t('edit.manage')}</h2>
              <Button className="flex-0" variant="destructive" disabled={isLoading} onClick={onDeleteOrganization}>
                {isLoading && (
                  <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                )}
                {t('button.delete')}
                </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
