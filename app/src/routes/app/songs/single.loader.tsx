import { SongsService } from "@/services";
import { Params } from "react-router-dom";

export async function loader({ params, songsService }: { params: Params, songsService: SongsService }) {
  return await songsService.getById(Number(params.id));
}
