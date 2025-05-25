import { OrganizationsService } from "@/services";

export async function loader({ request, organizationsService }: { request: Request, organizationsService: OrganizationsService }) {
  const params = new URL(request.url).searchParams;
  const id = params.get('id');
  const secret = params.get('secret');

  if (!id || !secret) {
    return null;
  }

  return await organizationsService.getInvite(Number(id), secret);
}
