import { Link, useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { toast } from "sonner";
import { IOrganization, ISongWithRole } from "@/types";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { SearchProvider, useSearch } from "@/hooks/search.provider";
import { AdvancedSearchForm } from "@/components/app/search/advanced-search-form";
import { SongSearchResultsList } from "@/components/app/search/song-search-results-list";
import { OrganizationBar, OptionalOrganization } from "@/components/app/organization-bar";
import { filterToSelection, selectionToFilter, useOrganizationFilter } from "@/hooks/use-organization-filter";
import { PageContent } from "@/components/shared/page-content";
import { FiltersActiveNotice } from "@/components/shared/filters-active-notice";
import { Button } from "@/components/ui/button";

export function Songs() {

  const { t } = useTranslation("songs");

  const { songsService } = useServices();
  const { organizations } = useAuth();

  const data = useLoaderData() as ISongWithRole[];

  return (
    <>
      <title>{t('title.list') + ' - BluPresenter'}</title>
      <SearchProvider
        songsService={songsService}
        defaultValue={data}
        initialOrganizationFilter={useOrganizationFilter.getState()}
      >
        <SongsContent userOrganizations={organizations} />
      </SearchProvider>
    </>
  );
}

function SongsContent({ userOrganizations }: { userOrganizations: IOrganization[] }) {

  const { t } = useTranslation("songs");

  const { formValues, setOrganizationFilter, resetFilters } = useSearch();
  const options: OptionalOrganization[] = [...userOrganizations, null];
  const [selectedOrganizations, setSelectedOrganizations] = useState<OptionalOrganization[]>(() => filterToSelection(userOrganizations));

  const filtersActive = (selectedOrganizations.length > 0 && selectedOrganizations.length < options.length)
    || (formValues.languages?.length ?? 0) > 0;

  const handleOrganizationsChange = (orgs: OptionalOrganization[]) => {
    const filter = selectionToFilter(orgs);
    setSelectedOrganizations(orgs);
    useOrganizationFilter.getState().setFilter(filter);

    setOrganizationFilter(filter)
      .catch((e) => {
        toast.error(t('errors.search'), {
          description: e?.message || '',
        });
      });
  };

  const handleResetFilters = () => {
    setSelectedOrganizations([]);
    useOrganizationFilter.getState().reset();

    resetFilters()
      .catch((e) => {
        toast.error(t('errors.search'), {
          description: e?.message || '',
        });
      });
  };

  return (
    <>
      <OrganizationBar
        organizations={options}
        selected={selectedOrganizations}
        multiselect
        onOrganizationsChange={handleOrganizationsChange}
      >
        <Button asChild><Link to="/app/songs/add">{t('actions.create')}</Link></Button>
        <Button asChild><Link to="/app/songs/import">{t('actions.import')}</Link></Button>
      </OrganizationBar>
      <PageContent>
        <AdvancedSearchForm />
        {filtersActive && <FiltersActiveNotice onReset={handleResetFilters} />}
        <ul className="mt-4 space-y-2">
          <SongSearchResultsList />
        </ul>
      </PageContent>
    </>
  );
}
