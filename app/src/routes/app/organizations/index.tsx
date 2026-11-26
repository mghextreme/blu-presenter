import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useServices } from "@/hooks/useServices";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate, useParams } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { IOrganization } from "@/types/organization.interface";
import { IOrganizationInvitation, IOrganizationUser, isRoleHigherOrEqualThan, ORGANIZATION_FEATURES, OrganizationFeature } from "@/types";
import { ListItemCard } from "@/components/shared/list-item-card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrganizationBar, OptionalOrganization } from "@/components/app/organization-bar";
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

const NEW_ORGANIZATION: IOrganization = {
  id: 0,
  name: '',
};

export function EditOrganization({
  edit = true
}: Readonly<EditOrganizationProps>) {
  return edit
    ? <ExistingOrganizationPage />
    : <OrganizationPage organization={NEW_ORGANIZATION} edit={false} />;
}

function ExistingOrganizationPage() {
  const params = useParams();
  const { organizationsService } = useServices();
  const { data } = useSuspenseQuery(organizationsService.currentQuery(Number(params.orgId)));

  // The form copies the organization into its state once per mount: keying by
  // id resets it when switching organizations, while refetches of the same
  // organization (e.g. after removing a member) keep the user's unsaved edits.
  return <OrganizationPage key={data.id} organization={data} edit={true} />;
}

type OrganizationPageProps = {
  organization: IOrganization
  edit: boolean
}

function OrganizationPage({
  organization,
  edit,
}: Readonly<OrganizationPageProps>) {

  const { t } = useTranslation("organizations");

  const navigate = useNavigate();

  const isPersonalSpace = edit && (organization.name == null || organization.name == '');

  const { user, setOrganizationById, organizations } = useAuth();
  const { organizationsService, authService } = useServices();

  const [memberQuery, setMemberQuery] = useState<string>('');
  const [disabledFeatures, setDisabledFeatures] = useState<OrganizationFeature[]>(organization.disabledFeatures ?? []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: organization.id,
      name: organization.name,
    },
  });

  const saveOrganization = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => edit
      ? organizationsService.update({ ...values }, organization.id)
      : organizationsService.add({ ...values }),
    onSuccess: (result) => {
      if (!edit && result) {
        authService.getAndSetOrganizations(result.id);
      }
      if (edit) {
        // Keep the locally stored organizations (with their features) in sync
        authService.refreshOrganizations();
      }
      navigate(`/app/organization/${edit ? organization.id : result?.id}`, { replace: true });
    },
    onError: (e) => {
      toast.error(t('update.failed'), {
        description: e?.message || '',
      });
    },
  });

  const onOrganizationLeft = () => {
    setOrganizationById();
    navigate("/app", { replace: true });
  };

  const leaveOrganization = useMutation({
    mutationFn: () => organizationsService.leave(organization.id),
    onSuccess: onOrganizationLeft,
    onError: (e) => {
      toast.error(t('error.leaveOrganization'), {
        description: e?.message || '',
      });
    },
  });

  const deleteOrganization = useMutation({
    mutationFn: () => organizationsService.delete(organization.id),
    onSuccess: onOrganizationLeft,
    onError: (e) => {
      toast.error(t('error.deleteOrganization'), {
        description: e?.message || '',
      });
    },
  });

  const isChangingOrganization = saveOrganization.isPending || leaveOrganization.isPending || deleteOrganization.isPending;

  const removeMember = useMutation({
    mutationFn: (memberId: number) => organizationsService.removeMember(memberId, organization.id),
    onError: (e) => {
      toast.error(t('error.removeMember'), {
        description: e?.message || '',
      });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: (invitationId: number) => organizationsService.cancelInvitation(invitationId, organization.id),
    onError: (e) => {
      toast.error(t('error.removeInvitation'), {
        description: e?.message || '',
      });
    },
  });

  const saveFeatures = useMutation({
    // Name is omitted on purpose: saving features must never touch the
    // organization name (which personal spaces don't have).
    mutationFn: (features: OrganizationFeature[]) => organizationsService.update({
      id: organization.id,
      disabledFeatures: features,
    }, organization.id),
    onSuccess: () => {
      toast.success(t('features.updateSuccess'));
      // Keep the locally stored organizations (with their features) in sync
      authService.refreshOrganizations();
    },
    onError: (e) => {
      toast.error(t('error.update'), {
        description: e?.message || '',
      });
    },
  });

  const onOrganizationSelected = (orgs: OptionalOrganization[]) => {
    const org = orgs[0];
    if (org && org.id !== organization.id) {
      navigate(`/app/organization/${org.id}`);
    }
  };

  const memberQueryLower = memberQuery.trim().toLowerCase();
  const filteredUsers = (organization.users ?? []).filter((member) =>
    !memberQueryLower
    || member.name?.toLowerCase().includes(memberQueryLower)
    || member.email?.toLowerCase().includes(memberQueryLower));

  const getMemberActions = (member: IOrganizationUser) => {
    const canDelete = isRoleHigherOrEqualThan(organization.role, member.role) && member.email !== user?.email;
    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.editMember')}
          asChild>
          <Link to={`/app/organization/${organization.id}/member/${member.id}`}>
            <PencilIcon className="size-3" />
          </Link>
        </Button>
        <Button
          disabled={!canDelete}
          size="sm"
          variant={canDelete ? 'destructive' : 'secondary'}
          title={t('actions.removeMember')}
          onClick={() => removeMember.mutate(member.id)}>
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
          disabled={organization.role !== 'owner' && user?.email !== invitation?.inviter?.email}
          onClick={() => cancelInvitation.mutate(invitation.id)}>
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

  const isFeaturesUnchanged = (organization.disabledFeatures ?? []).length === disabledFeatures.length
    && disabledFeatures.every((feature) => (organization.disabledFeatures ?? []).includes(feature));

  return (
    <div>
      <title>{t('title.edit', {organization: organization.name || t('defaultName')}) + ' - BluPresenter'}</title>
      <OrganizationBar
        organizations={edit ? organizations : []}
        selected={edit ? [organization] : []}
        editable={edit}
        subtitle={edit ? undefined : t('add.title')}
        onOrganizationsChange={edit ? onOrganizationSelected : undefined}
      />
      <PageContent>
      {isPersonalSpace && (
        <Alert className="mb-6">
          <AlertTitle>{t('warning.personalSpace.title')}</AlertTitle>
          <AlertDescription>
            {t('warning.personalSpace.message')}
          </AlertDescription>
        </Alert>
      )}
      {!isPersonalSpace && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => saveOrganization.mutate(values))} className="max-w-lg space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('input.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={edit && !isRoleHigherOrEqualThan(organization.role, 'admin')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}></FormField>
            <div className="flex flex-row align-start space-x-2">
                {(isRoleHigherOrEqualThan(organization.role, 'admin') || !edit) && (
                  <Button className="flex-0" type="submit" disabled={isChangingOrganization}>
                    {isChangingOrganization && (
                      <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                    )}
                    {t('button.' + (edit ? 'update' : 'add'))}
                    </Button>
                )}
                <Button className="flex-0" type="button" variant="secondary" asChild><Link to={'/app'}>{t('button.cancel')}</Link></Button>
              </div>
            </form>
        </Form>
      )}
          {edit && !isPersonalSpace && isRoleHigherOrEqualThan(organization.role, 'admin') && (
            <>
              <h2 className="text-xl mt-6 mb-4">{t('edit.members')}</h2>
              <div className="flex items-center justify-between gap-2 mb-4">
                <Input
                  placeholder={t('members.searchPlaceholder')}
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="max-w-sm"
                />
                <Button asChild><Link to={`/app/organization/${organization.id}/invite`}>{t('actions.inviteMember')}</Link></Button>
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
              {(organization.invitations?.length ?? 0) > 0 && (
                <>
                  <h2 className="text-xl mt-6 mb-4">{t('edit.pendingInvitations')}</h2>
                  <ul className="space-y-2">
                    {(organization.invitations ?? []).map((invitation) => (
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
              <h2 className="text-xl mt-6 mb-4">{t('edit.features')}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t('edit.featuresDescription')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ORGANIZATION_FEATURES.map((feature: OrganizationFeature) => (
                  <div key={feature} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <div className="text-base font-medium">{t('features.' + feature)}</div>
                      <div className="text-sm text-muted-foreground">{t('features.' + feature + 'Description')}</div>
                    </div>
                    <Switch
                      checked={!disabledFeatures.includes(feature)}
                      disabled={!isRoleHigherOrEqualThan(organization.role, 'admin')}
                      onCheckedChange={(checked) => {
                        setDisabledFeatures((current) =>
                          checked
                            ? current.filter((f) => f !== feature)
                            : [...current, feature]
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
              {isRoleHigherOrEqualThan(organization.role, 'admin') && (
                <Button
                  className="mt-4"
                  type="button"
                  disabled={saveFeatures.isPending || isFeaturesUnchanged}
                  onClick={() => saveFeatures.mutate(disabledFeatures)}>
                  {saveFeatures.isPending && (
                    <ArrowPathIcon className="size-4 ms-2 animate-spin"></ArrowPathIcon>
                  )}
                  {t('button.update')}
                </Button>
              )}
            </>
          )}
          {edit && !isPersonalSpace && (
            <>
            <h2 className="text-xl mt-6 mb-4">{t('edit.manage')}</h2>
              <div className="flex flex-row align-start space-x-2">
              {organization.role === 'owner' && (
                <>
                  <Button className="flex-0" type="button" asChild>
                    <Link to={`/app/organization/${organization.id}/transfer`}>{t('button.transfer')}</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-0" variant="destructive" disabled>
                        {isChangingOrganization && (
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
                        <AlertDialogAction variant="destructive" disabled={isChangingOrganization} onClick={() => deleteOrganization.mutate()}>{t('button.confirm')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {organization.role !== 'owner' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-0" variant="destructive" disabled={isChangingOrganization}>
                      {isChangingOrganization && (
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
                      <AlertDialogAction variant="destructive" disabled={isChangingOrganization} onClick={() => leaveOrganization.mutate()}>{t('button.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              </div>
            </>
          )}
      </PageContent>
    </div>
  );
}
