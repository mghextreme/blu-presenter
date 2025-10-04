import { SessionsService } from "@/services";
import { Params } from "react-router-dom";

export async function loader({ params, sessionsService }: { params: Params, sessionsService: SessionsService }) {
  return await sessionsService.getById(Number(params.id));
}
