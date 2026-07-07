/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ISongWithRole } from "@/types";
import { useServices } from "@/hooks/useServices";
import { SearchProvider } from "@/hooks/search.provider";
import { AdvancedSearchForm } from "@/components/app/search/advanced-search-form";
import { SongSearchResultsList } from "@/components/app/search/song-search-results-list";

export function Songs() {

  const { t } = useTranslation("songs");

  const { songsService } = useServices();

  const data = useLoaderData() as ISongWithRole[];

  return (
    <div className="p-2 sm:p-8">
      <title>{t('title.list') + ' - BluPresenter'}</title>
      <h1 className="text-3xl mb-4">{t('title.list')}</h1>
      <SearchProvider songsService={songsService} defaultValue={data}>
        <AdvancedSearchForm />
        <ul className="mt-4 space-y-2">
          <SongSearchResultsList />
        </ul>
      </SearchProvider>
    </div>
  );
}
