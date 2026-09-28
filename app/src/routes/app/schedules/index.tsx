import { Link, useLoaderData } from "react-router-dom";
import { format, parse } from "date-fns";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { ISchedule, isRoleHigherOrEqualThan } from "@/types";
import { getLocaleConfig } from "@/components/ui/date-picker";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { useFilteredList } from "@/hooks/use-filtered-list";
import { filterToSelection } from "@/hooks/use-organization-filter";
import { OrganizationBar } from "@/components/app/organization-bar";
import { PageContent } from "@/components/shared/page-content";
import { ListItemCard } from "@/components/shared/list-item-card";
import { QuerySearchForm } from "@/components/shared/query-search-form";
import { LoadMoreButton } from "@/components/shared/load-more";
import { FiltersActiveNotice } from "@/components/shared/filters-active-notice";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function Schedules() {

  const { t, i18n } = useTranslation("schedules");
  const { organizations } = useAuth();

  const data = useLoaderData() as ISchedule[];
  const { schedulesService } = useServices();

  const list = useFilteredList<ISchedule>({
    defaultValue: data,
    initialOrganizations: filterToSelection(organizations),
    search: (payload) => schedulesService.search(payload),
    onError: (e) => {
      toast.error(t('error.search'), {
        description: e?.message || '',
      });
    },
  });

  const filtersActive = list.selectedOrganizations.length > 0
    && list.selectedOrganizations.length < organizations.length;

  const lang = i18n.language?.substring(0, 2) ?? "en";
  const { dateFns, formatStr } = getLocaleConfig(lang);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '';
    try {
      const parsed = parse(date, "yyyy-MM-dd", new Date());
      return format(parsed, formatStr, { locale: dateFns });
    } catch {
      return date;
    }
  };

  const onDeleteSchedule = async (schedule: ISchedule) => {
    if (!schedule.organization?.id) {
      return;
    }

    try {
      await schedulesService.delete(schedule.id, schedule.organization.id);
      schedulesService.clearCache();
      list.refresh();
    } catch (e: any) {
      toast.error(
        t('error.deleteSchedule'),
      );
    }
  }

  const getCardActions = (schedule: ISchedule) => {
    const canManage = isRoleHigherOrEqualThan(schedule.organization?.role, 'member');

    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.view')}
          asChild>
          <Link to={`/app/schedules/${schedule.id}/view`}>
            <EyeIcon className="size-3" />
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          title={t('actions.edit')}
          asChild={canManage}
          disabled={!canManage}>
          {canManage ? (
            <Link to={`/app/schedules/${schedule.id}/edit`}>
              <PencilIcon className="size-3" />
            </Link>
          ) : (
            <PencilIcon className="size-3" />
          )}
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
              <AlertDialogDescription>{t('message.deleteSchedule.description', { name: schedule.title })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDeleteSchedule(schedule)}>{t('button.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  return (
    <>
      <title>{t('title.list') + ' - BluPresenter'}</title>
      <OrganizationBar
        organizations={organizations}
        selected={list.selectedOrganizations}
        multiselect
        onOrganizationsChange={list.setOrganizations}
      >
        <Button asChild><Link to="/app/schedules/add">{t('actions.create')}</Link></Button>
      </OrganizationBar>
      <PageContent className="flex flex-col gap-4">
        <QuerySearchForm
          onSearch={list.setQuery}
          isLoading={list.isLoading}
          placeholder={t('search.placeholder')}
          className="max-w-xl"
        />
        {filtersActive && <FiltersActiveNotice onReset={list.resetOrganizations} />}
        <ul className="space-y-2">
          {list.results.map((schedule) => (
            <li key={schedule.id}>
              <ListItemCard
                title={schedule.title}
                description={formatDate(schedule.date)}
                organization={schedule.organization}
                actions={getCardActions(schedule)}
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
