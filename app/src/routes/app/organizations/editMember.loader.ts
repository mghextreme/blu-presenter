import { Params } from "react-router-dom";
import { OrganizationsService } from "@/services";

export async function loader({ params, organizationsService, orgId }: { params: Params, organizationsService: OrganizationsService, orgId: number }) {
  return await organizationsService.getMember(Number(params.id), orgId);
}
