import { SongsService } from "@/services";

export async function loader({ songsService }: { songsService: SongsService }) {
  return await songsService.getAll();
}
