import { SchedulesService } from "@/services";
import { Params } from "react-router-dom";

export async function loader({ params, schedulesService, secret }: { params: Params, schedulesService: SchedulesService, secret?: string }) {
  return await schedulesService.getById(Number(params.id), secret);
}
