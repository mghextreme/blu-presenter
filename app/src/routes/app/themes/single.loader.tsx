import { ThemesService } from "@/services";
import { Params } from "react-router-dom";

export async function loader({ params, themesService }: { params: Params, themesService: ThemesService, secret?: string }) {
  return await themesService.getById(Number(params.id));
}
