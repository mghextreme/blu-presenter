import { SchedulesService } from "@/services";
import { PAGE_SIZE } from "@/lib/pagination";
import { resolveFilter } from "@/hooks/use-organization-filter";
import { useAuth } from "@/hooks/useAuth";

export async function loader({ schedulesService }: { schedulesService: SchedulesService }) {
  const { organizations } = resolveFilter(useAuth.getState().organizations);
  return await schedulesService.search({
    itemsPerPage: PAGE_SIZE,
    organizations,
  });
}
