import { OrganizationsService } from "@/services";

export async function loader({ organizationsService }: { organizationsService: OrganizationsService }) {
  return await organizationsService.getInvitations();
}
