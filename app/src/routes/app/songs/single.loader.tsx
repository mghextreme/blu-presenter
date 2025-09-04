import { SongsService } from "@/services";
import { Params } from "react-router-dom";

export async function loader({ params, songsService, secret }: { params: Params, songsService: SongsService, secret?: string }) {
  return await songsService.getById(Number(params.id), secret);
}
