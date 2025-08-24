/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ISongWithRole, isRoleHigherOrEqualThan } from "@/types";
import { useServices } from "@/hooks/services.provider";
import { SearchProvider } from "@/hooks/search.provider";
import { AdvancedSearchForm } from "@/components/app/search/advanced-search-form";
import { SearchResultsList } from "@/components/app/search/search-results-list";
import { CopySongToOrganization } from "@/components/app/songs/copy-song-to-organization";
import { Button } from "@/components/ui/button";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import { useAuth } from "@/hooks/useAuth";

export default function Discover() {

  const { t } = useTranslation("discover");

  const { songsService } = useServices();

  const { organizations } = useAuth();
  const orgIndexMap: {[orgId: number]: number} = {};
  for (let i = 0; i < organizations.length; i++) {
    orgIndexMap[organizations[i].id] = i;
  }

  const getButtonOrgIndex = (item: ISongWithRole) => {
    if (!item.organization) {
      return -1;
    }

    return orgIndexMap[item.organization.id];
  }

  const getButtonActions = (item: ISongWithRole) => {
    const canEdit = isRoleHigherOrEqualThan(item.organization?.role, 'member');

    return (
      <>
        <Button
          type="button"
          size="sm"
          title={t('actions.view')}
          asChild>
          <Link to={`/app/songs/${item.id}/view`}>
            <EyeIcon className="size-3" />
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          title={t('actions.edit')}
          asChild={canEdit}
          disabled={!canEdit}>
          {canEdit ? (
            <Link to={`/app/songs/${item.id}/edit`}>
              <PencilIcon className="size-3" />
            </Link>
          ) : (
            <PencilIcon className="size-3" />
          )}
        </Button>
        <CopySongToOrganization songId={item.id} title={item.title} artist={item.artist} variant="default"></CopySongToOrganization>
      </>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-4">{t('title')}</h1>
      <SearchProvider songsService={songsService}>
        <AdvancedSearchForm />
        <ul className="mt-4 space-y-2">
          <SearchResultsList getActions={getButtonActions} getColorIndex={getButtonOrgIndex} />
        </ul>
      </SearchProvider>
    </div>
  );
}
