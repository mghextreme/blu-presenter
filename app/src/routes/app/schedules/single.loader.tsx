import { SchedulesService } from "@/services";
import { Params } from "react-router-dom";

export async function loader({ params, schedulesService }: { params: Params, schedulesService: SchedulesService }) {
  return await schedulesService.getById(Number(params.id));
}
