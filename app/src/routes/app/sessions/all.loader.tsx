import { SessionsService } from "@/services";

export async function loader({ sessionsService }: { sessionsService: SessionsService }) {
  return await sessionsService.getAll();
}
