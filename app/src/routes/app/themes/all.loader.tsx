import { ThemesService } from "@/services";

export async function loader({ themesService }: { themesService: ThemesService }) {
  return await themesService.getAll();
}
