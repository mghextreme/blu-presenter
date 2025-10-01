import { SessionsService, ThemesService } from "@/services";
import { ITheme } from "@/types";
import { Params } from "react-router-dom";

export async function loader({
  params,
  sessionsService,
  themesService,
}: {
  params: Params,
  sessionsService: SessionsService,
  themesService: ThemesService,
}) {

  const sessionPromise = sessionsService.getBySecret(
    Number(params.orgId),
    Number(params.sessionId),
    params.secret,
  );

  let themes: ITheme[] = [];
  if (!params.theme || !['lyrics', 'subtitles', 'teleprompter'].includes(params.theme)) {
    themes = await themesService.getBySessionSecret(
      Number(params.orgId),
      Number(params.sessionId),
      params.secret,
      !!params.theme ? Number(params.theme) : undefined,
    );
  }

  return {
    session: await sessionPromise,
    themes,
  }
}
