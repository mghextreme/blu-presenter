import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { PageContent } from "@/components/shared/page-content";
import { ListItemCard } from "@/components/shared/list-item-card";
import { IOrganizationInvitation } from "@/types";
import CheckIcon from "@heroicons/react/24/solid/CheckIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function Welcome() {

  const { t } = useTranslation('app');
  const { t: tOrg } = useTranslation('organizations');

  const { organizationsService, authService } = useServices();
  const { organizations } = useAuth();

  const { data: invitations } = useSuspenseQuery(organizationsService.invitationsQuery());

  const acceptInvitation = useMutation({
    mutationFn: (invitationId: number) => organizationsService.acceptInvitation(invitationId),
    onSuccess: async () => {
      await authService.refreshOrganizations();

      toast.success(t('message.acceptInvitation.title'), {
        description: t('message.acceptInvitation.description'),
      });
    },
    onError: (e) => {
      toast.error(t('error.acceptInvitation.title'), {
        description: e?.message ?? '',
      });
    },
  });

  const rejectInvitation = useMutation({
    mutationFn: (invitationId: number) => organizationsService.rejectInvitation(invitationId),
    onSuccess: () => {
      toast.success(t('message.rejectInvitation.title'));
    },
    onError: (e) => {
      toast.error(t('error.rejectInvitation.title'), {
        description: e?.message ?? '',
      });
    },
  });

  const getInvitationActions = (invitation: IOrganizationInvitation) => {
    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.accept')}
          onClick={() => acceptInvitation.mutate(invitation.id)}>
          <CheckIcon className="size-3" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          title={t('actions.reject')}
          onClick={() => rejectInvitation.mutate(invitation.id)}>
          <TrashIcon className="size-3" />
        </Button>
      </>
    );
  }

  return (
    <PageContent className="flex flex-col gap-6">
      <title>{t('welcome.message') + ' - BluPresenter'}</title>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-xl">{t('organizations.title')}</h2>
          <Button asChild>
            <Link to="/app/organizations/add">{tOrg('actions.create')}</Link>
          </Button>
        </div>
        <ul className="space-y-2">
          {organizations.map((org) => (
            <li key={org.id}>
              <ListItemCard
                title={org.name || tOrg('defaultName')}
                organization={org}
                additionalBadges={org.role && (
                  <Badge variant="secondary" className="me-3 my-auto">{t('role.' + org.role)}</Badge>
                )}
                actions={(
                  <Button type="button" size="sm" title={t('actions.manage')} asChild>
                    <Link to={`/app/organization/${org.id}`}>
                      <PencilIcon className="size-3" />
                    </Link>
                  </Button>
                )}
              />
            </li>
          ))}
        </ul>
      </section>

      {invitations.length > 0 && (
        <section>
          <h2 className="text-xl mb-4">{t('invitations.title')}</h2>
          <ul className="space-y-2">
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <ListItemCard
                  title={invitation.organization?.name || tOrg('defaultName')}
                  organization={invitation.organization}
                  additionalBadges={(
                    <Badge variant="secondary" className="me-3 my-auto">{t('role.' + invitation.role)}</Badge>
                  )}
                  actions={getInvitationActions(invitation)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageContent>
  );
}
