import { SchedulesService } from "@/services";

export async function loader({ schedulesService }: { schedulesService: SchedulesService }) {
  return await schedulesService.getAll();
}
