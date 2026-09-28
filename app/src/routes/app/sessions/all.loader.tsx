import { SessionsService } from "@/services";
import { PAGE_SIZE } from "@/lib/pagination";
import { resolveFilter } from "@/hooks/use-organization-filter";
import { useAuth } from "@/hooks/useAuth";

export async function loader({ sessionsService }: { sessionsService: SessionsService }) {
  const { organizations } = resolveFilter(useAuth.getState().organizations);
  return await sessionsService.search({
    itemsPerPage: PAGE_SIZE,
    organizations,
  });
}
