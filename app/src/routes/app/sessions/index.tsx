import { Link, useLoaderData } from "react-router-dom";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { Badge } from "@/components/ui/badge";
import { ISession, isRoleHigherOrEqualThan } from "@/types";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { useFilteredList } from "@/hooks/use-filtered-list";
import { filterToSelection } from "@/hooks/use-organization-filter";
import { OrganizationBar } from "@/components/app/organization-bar";
import { PageTitle } from "@/components/shared/page-title";
import { PageContent } from "@/components/shared/page-content";
import { ListItemCard } from "@/components/shared/list-item-card";
import { QuerySearchForm } from "@/components/shared/query-search-form";
import { LoadMoreButton } from "@/components/shared/load-more";
import { FiltersActiveNotice } from "@/components/shared/filters-active-notice";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function Sessions() {

  const { t } = useTranslation("sessions");
  const { organizations } = useAuth();

  const data = useLoaderData() as ISession[];
  const { sessionsService } = useServices();

  const list = useFilteredList<ISession>({
    defaultValue: data,
    initialOrganizations: filterToSelection(organizations),
    search: (payload) => sessionsService.search(payload),
    onError: (e) => {
      toast.error(t('error.search'), {
        description: e?.message || '',
      });
    },
  });

  const filtersActive = list.selectedOrganizations.length > 0
    && list.selectedOrganizations.length < organizations.length;

  const getSessionName = (session: ISession) => {
    if (session.default) {
      return t('session.defaultName');
    }
    return session.name;
  }

  const onDeleteSession = async (session: ISession) => {
    if (!session.organization?.id) {
      return;
    }

    try {
      await sessionsService.delete(session.id, session.organization.id);
      sessionsService.clearCache();
      list.refresh();
    } catch (e: any) {
      toast.error(
        t('error.deleteSession'),
      );
    }
  }

  const getCardActions = (session: ISession) => {
    const canManage = isRoleHigherOrEqualThan(session.organization?.role, 'admin');

    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.edit')}
          asChild={canManage}
          disabled={!canManage}>
          {canManage ? (
            <Link to={`/app/sessions/${session.id}/edit`}>
              <PencilIcon className="size-3" />
            </Link>
          ) : (
            <PencilIcon className="size-3" />
          )}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="flex-0" variant="destructive" disabled={!canManage || session.default} title={t('actions.delete')}>
              <TrashIcon className="size-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('message.deleteSession.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('message.deleteSession.description', {name: getSessionName(session)})}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDeleteSession(session)}>{t('button.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  return (
    <>
      <title>{t('title.list') + ' - BluPresenter'}</title>
      <PageTitle value={t('list.title')} />
      <OrganizationBar
        organizations={organizations}
        selected={list.selectedOrganizations}
        multiselect
        onOrganizationsChange={list.setOrganizations}
      >
        <Button asChild><Link to="/app/sessions/add">{t('actions.create')}</Link></Button>
      </OrganizationBar>
      <PageContent className="flex flex-col gap-4">
        <QuerySearchForm
          onSearch={list.setQuery}
          isLoading={list.isLoading}
          placeholder={t('list.search.placeholder')}
          className="max-w-xl"
        />
        {filtersActive && <FiltersActiveNotice onReset={list.resetOrganizations} />}
        <ul className="space-y-2">
          {list.results.map((session) => (
            <li key={session.id}>
              <ListItemCard
                title={getSessionName(session)}
                organization={session.organization}
                additionalBadges={session.default && (
                  <Badge variant="secondary" className="me-3 my-auto">{t('session.defaultName')}</Badge>
                )}
                actions={getCardActions(session)}
              />
            </li>
          ))}
          {list.hasMore && (
            <li>
              <LoadMoreButton onClick={list.loadMore} isLoading={list.isLoading} />
            </li>
          )}
        </ul>
      </PageContent>
    </>
  );
}
