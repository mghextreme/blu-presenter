import { OrganizationsService } from "@/services";

export async function loader({ organizationsService, orgId }: { organizationsService: OrganizationsService, orgId: number }) {
  return await organizationsService.getCurrent(orgId);
}
