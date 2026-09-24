import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OrganizationsService } from "@/services";
import { useServices } from "@/hooks/useServices";
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
import { IOrganizationInvitation, IOrganizationUser, OrganizationRoleOptions, isRoleHigherOrEqualThan } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrganizationBar } from "@/components/app/organization-bar";
import { PageContent } from "@/components/shared/page-content";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const formSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
});

type EditOrganizationProps = {
  edit?: boolean
}

const buildColumns = (t: TFunction, orgId: number, userEmail: string | undefined, userRole: OrganizationRoleOptions | undefined, organizationsService: OrganizationsService, revalidate: () => void) => {
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
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const canDelete = isRoleHigherOrEqualThan(userRole, row.original.role) && row.original.email !== userEmail;
        return (
          <div className="flex justify-end space-x-2 -m-1">
            {isRoleHigherOrEqualThan(userRole, 'admin') && (
              <>
                <Button
                  type="button"
                  size="sm"
                  title={t('actions.editMember')}
                  asChild>
                  <Link to={`/app/organization/${orgId}/member/${row.original.id}`}>
                    <PencilIcon className="size-3" />
                  </Link>
                </Button>
                <Button
                  disabled={!canDelete}
                  size="sm"
                  variant={canDelete ? 'destructive' : 'secondary'}
                  title={t('actions.removeMember')}
                  onClick={async () => {
                    try {
                      await organizationsService.removeMember(row.original.id, orgId);
                      revalidate();
                    } catch (e: any) {
                      toast.error(t('actions.removeMember'), {
                        description: e?.message || '',
                      });
                    }
                  }}>
                  <TrashIcon className="size-3" />
                </Button>
              </>
            )}
          </div>
        )
      }
    },
  ];

  return columns;
}

const buildInvitationColumns = (t: TFunction, orgId: number, userEmail: string | undefined, userRole: OrganizationRoleOptions | undefined, organizationsService: OrganizationsService, revalidate: () => void) => {
  const copyLink = (id: number, secret: string) => {
    const link = `${window.location.origin}/signup?id=${id}&secret=${secret}`;
    navigator.clipboard.writeText(link)
      .then(
        () => {
          toast.success(t('invite.success'), {
            description: t('invite.linkCopied'),
          });
        },
        (e) => {
          toast.error(t('error.copyToClipboard'), {
            description: e?.message || '',
          });
        }
      );
  }

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
              onClick={() => copyLink(row.original.id, row.original.secret)}>
              <ClipboardCopyIcon className="size-3" />
            </Button>
            {isRoleHigherOrEqualThan(userRole, 'admin') && (
              <Button
                size="sm"
                variant="destructive"
                title={t('actions.removeInvitation')}
                disabled={userRole !== 'owner' && userEmail !== row.original?.inviter?.email}
                onClick={async () => {
                  try {
                    await organizationsService.cancelInvitation(row.original.id, orgId);
                    revalidate();
                  } catch (e: any) {
                    toast.error(t('actions.removeInvitation'), {
                      description: e?.message || '',
                    });
                  }
                }}>
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

export function EditOrganization({
  edit = true
}: EditOrganizationProps) {

  const { t } = useTranslation("organizations");

  const navigate = useNavigate();

  const loadedData = useLoaderData() as IOrganization;
  const data = edit ? loadedData : {
    id: 0,
    name: '',
  };

  const isPersonalSpace = edit && (data.name == null || data?.name == '');

  const { revalidate } = useRevalidator();

  const { user, setOrganizationById } = useAuth();
  const { organizationsService, authService } = useServices();

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
    setLoading(true);
    let action;
    if (edit) {
      action = organizationsService.update({
        ...values,
      }, data.id);
    } else {
      action = organizationsService.add({
        ...values,
      });
    }
    action
      .then((result: IOrganization | null) => {
        if (!edit && result) {
          authService.getAndSetOrganizations(result.id);
        }
        navigate(`/app/organization/${edit ? data.id : result?.id}`, { replace: true });
      })
      .catch((e) => {
        toast.error(t('update.failed'), {
          description: e?.message || '',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const onLeaveOrganization = async () => {
    try {
      setLoading(true);
      await organizationsService.leave(data.id);
      setOrganizationById();
      navigate("/app", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  const onDeleteOrganization = async () => {
    try {
      setLoading(true);
      await organizationsService.delete(data.id);
      setOrganizationById();
      navigate("/app", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  const columns = buildColumns(t, data.id, user?.email, loadedData?.role, organizationsService, revalidate);
  const invitationColumns = buildInvitationColumns(t, data.id, user?.email, loadedData?.role, organizationsService, revalidate);

  useEffect(() => {
    form.setValue('id', data.id);
    form.setValue('name', data?.name ?? '');
  }, [loadedData]);

  return (
    <div>
      <title>{t('title.edit', {organization: data.name || t('defaultName')}) + ' - BluPresenter'}</title>
      <OrganizationBar
        organizations={edit ? [data] : []}
        selected={edit ? [data] : []}
        subtitle={edit ? undefined : t('add.title')}
      />
      <PageContent>
      {isPersonalSpace ? (
        <Alert>
          <AlertTitle>{t('warning.personalSpace.title')}</AlertTitle>
          <AlertDescription>
            {t('warning.personalSpace.message')}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('input.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPersonalSpace || (edit && !isRoleHigherOrEqualThan(loadedData?.role, 'admin'))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}></FormField>
              <div className="flex flex-row align-start space-x-2">
                {(!isPersonalSpace && isRoleHigherOrEqualThan(loadedData?.role, 'admin') || !edit) && (
                  <Button className="flex-0" type="submit" disabled={isLoading}>
                    {isLoading && (
                      <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                    )}
                    {t('button.' + (edit ? 'update' : 'add'))}
                    </Button>
                )}
                <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app'}>{t('button.cancel')}</Link></Button>
              </div>
            </form>
          </Form>
          {edit && isRoleHigherOrEqualThan(loadedData?.role, 'admin') && (
            <>
              <h2 className="text-xl mt-6 mb-4">{t('edit.members')}</h2>
              <DataTable columns={columns} data={loadedData.users ?? []} addButton={(
                isRoleHigherOrEqualThan(loadedData?.role, 'admin') ? (
                  <Button asChild><Link to={`/app/organization/${data.id}/invite`}>{t('actions.inviteMember')}</Link></Button>
                ) : null
              )}></DataTable>
              {(loadedData?.invitations?.length ?? 0) > 0 && (
                <>
                  <h2 className="text-xl mt-6 mb-4">{t('edit.pendingInvitations')}</h2>
                  <DataTable columns={invitationColumns} data={loadedData.invitations ?? []}></DataTable>
                </>
              )}
            </>
          )}
          {edit && (
            <>
            <h2 className="text-xl mt-6 mb-4">{t('edit.manage')}</h2>
              <div className="flex flex-row align-start space-x-2">
              {loadedData?.role === 'owner' && (
                <>
                  <Button className="flex-0" type="button" asChild>
                    <Link to={`/app/organization/${data.id}/transfer`}>{t('button.transfer')}</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-0" variant="destructive" disabled>
                        {isLoading && (
                          <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                        )}
                        {t('button.delete')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('message.deleteOrganization.title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('message.deleteOrganization.description')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={isLoading} onClick={onDeleteOrganization}>{t('button.confirm')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {loadedData && loadedData.role !== 'owner' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-0" variant="destructive" disabled={isLoading}>
                      {isLoading && (
                        <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                      )}
                      {t('button.leave')}
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('message.leaveOrganization.title')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('message.leaveOrganization.description')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" disabled={isLoading} onClick={onLeaveOrganization}>{t('button.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              </div>
            </>
          )}
        </>
      )}
      </PageContent>
    </div>
  );
}
