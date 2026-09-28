import { SongsService } from "@/services";
import { PAGE_SIZE } from "@/lib/pagination";
import { resolveFilter } from "@/hooks/use-organization-filter";
import { useAuth } from "@/hooks/useAuth";

export async function loader({ songsService, lang }: { songsService: SongsService, lang: string }) {
  const filter = resolveFilter(useAuth.getState().organizations);
  return await songsService.search({
    queryLanguage: lang,
    itemsPerPage: PAGE_SIZE,
    organizations: filter.organizations,
    searchPublicArchive: filter.searchPublicArchive,
  });
}
