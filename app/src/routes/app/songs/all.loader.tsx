import { SongsService } from "@/services";
import { SupportedLanguage } from "@/types";

export async function loader({ songsService, lang }: { songsService: SongsService, lang: SupportedLanguage }) {
  return await songsService.search({
    queryLanguage: lang,
  });
}
