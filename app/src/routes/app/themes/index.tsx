import { Link, useLoaderData } from "react-router-dom";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { isRoleHigherOrEqualThan, ITheme } from "@/types";
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
import { CopyThemeToOrganization } from "@/components/app/themes/copy-theme-to-organization";

export function Themes() {

  const { t } = useTranslation("themes");
  const { organizations } = useAuth();

  const data = useLoaderData() as ITheme[];
  const { themesService } = useServices();

  const list = useFilteredList<ITheme>({
    defaultValue: data,
    initialOrganizations: filterToSelection(organizations),
    search: (payload) => themesService.search(payload),
    onError: (e) => {
      toast.error(t('error.search'), {
        description: e?.message || '',
      });
    },
  });

  const filtersActive = list.selectedOrganizations.length > 0
    && list.selectedOrganizations.length < organizations.length;

  const onDeleteTheme = async (theme: ITheme) => {
    if (!theme.organization?.id) {
      return;
    }

    try {
      await themesService.delete(theme.id, theme.organization.id);
      themesService.clearCache();
      list.refresh();
    } catch (e: any) {
      toast.error(
        t('error.deleteTheme'),
      );
    }
  }

  const getCardActions = (theme: ITheme) => {
    const canEdit = isRoleHigherOrEqualThan(theme.organization?.role, 'member');
    const canDelete = isRoleHigherOrEqualThan(theme.organization?.role, 'admin');

    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.edit')}
          asChild={canEdit}
          disabled={!canEdit}>
          {canEdit ? (
            <Link to={`/app/themes/${theme.id}/edit`}>
              <PencilIcon className="size-3" />
            </Link>
          ) : (
            <PencilIcon className="size-3" />
          )}
        </Button>
        <CopyThemeToOrganization themeId={theme.id} name={theme.name} sourceOrgId={theme.organization?.id} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="flex-0" variant="destructive" disabled={!canDelete} title={t('actions.delete')}>
              <TrashIcon className="size-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('message.deleteTheme.title')}</AlertDialogTitle>
              <AlertDialogDescription>{t('message.deleteTheme.description', {name: theme.name})}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('button.cancel')}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDeleteTheme(theme)}>{t('button.confirm')}</AlertDialogAction>
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
        <Button asChild><Link to="/app/themes/add">{t('actions.create')}</Link></Button>
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
          {list.results.map((theme) => (
            <li key={theme.id}>
              <ListItemCard
                title={theme.name}
                description={t(`theme.${theme.extends}`)}
                organization={theme.organization}
                actions={getCardActions(theme)}
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
