import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { IOrganizationInvitation, IOrganizationUser, isRoleHigherOrEqualThan } from "@/types";
import { ListItemCard } from "@/components/shared/list-item-card";
import { Badge } from "@/components/ui/badge";
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
  const [memberQuery, setMemberQuery] = useState<string>('');

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

  const memberQueryLower = memberQuery.trim().toLowerCase();
  const filteredUsers = (loadedData.users ?? []).filter((member) =>
    !memberQueryLower
    || member.name?.toLowerCase().includes(memberQueryLower)
    || member.email?.toLowerCase().includes(memberQueryLower));

  const getMemberActions = (member: IOrganizationUser) => {
    const canDelete = isRoleHigherOrEqualThan(loadedData?.role, member.role) && member.email !== user?.email;
    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.editMember')}
          asChild>
          <Link to={`/app/organization/${data.id}/member/${member.id}`}>
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
              await organizationsService.removeMember(member.id, data.id);
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
    );
  };

  const getInvitationActions = (invitation: IOrganizationInvitation) => {
    const copyLink = () => {
      const link = `${window.location.origin}/signup?id=${invitation.id}&secret=${invitation.secret}`;
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

    return (
      <>
        <Button
          size="sm"
          title={t('actions.copyLink')}
          onClick={copyLink}>
          <ClipboardCopyIcon className="size-3" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          title={t('actions.removeInvitation')}
          disabled={loadedData?.role !== 'owner' && user?.email !== invitation?.inviter?.email}
          onClick={async () => {
            try {
              await organizationsService.cancelInvitation(invitation.id, data.id);
              revalidate();
            } catch (e: any) {
              toast.error(t('actions.removeInvitation'), {
                description: e?.message || '',
              });
            }
          }}>
          <TrashIcon className="size-3" />
        </Button>
      </>
    );
  };

  const getInvitationDescription = (invitation: IOrganizationInvitation) => {
    const name = invitation.inviter?.name;
    const email = invitation.inviter?.email;
    if (!name && !email) {
      return undefined;
    }
    return [name, email && `(${email})`].filter(Boolean).join(' ');
  };

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
              <div className="flex items-center justify-between gap-2 mb-4">
                <Input
                  placeholder={t('members.searchPlaceholder')}
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Button asChild><Link to={`/app/organization/${data.id}/invite`}>{t('actions.inviteMember')}</Link></Button>
              </div>
              <ul className="space-y-2">
                {filteredUsers.map((member) => (
                  <li key={member.id}>
                    <ListItemCard
                      title={member.name}
                      description={member.email}
                      additionalBadges={(
                        <Badge variant="secondary" className="me-3 my-auto">{t('role.' + member.role)}</Badge>
                      )}
                      actions={getMemberActions(member)}
                    />
                  </li>
                ))}
                {filteredUsers.length === 0 && (
                  <li className="text-sm opacity-50">{t('members.searchNoneFound')}</li>
                )}
              </ul>
              {(loadedData?.invitations?.length ?? 0) > 0 && (
                <>
                  <h2 className="text-xl mt-6 mb-4">{t('edit.pendingInvitations')}</h2>
                  <ul className="space-y-2">
                    {(loadedData?.invitations ?? []).map((invitation) => (
                      <li key={invitation.id}>
                        <ListItemCard
                          title={invitation.email}
                          description={getInvitationDescription(invitation)}
                          additionalBadges={(
                            <Badge variant="secondary" className="me-3 my-auto">{t('role.' + invitation.role)}</Badge>
                          )}
                          actions={getInvitationActions(invitation)}
                        />
                      </li>
                    ))}
                  </ul>
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
