import { SessionsService, ThemesService } from '@/services';
import { isBaseTheme, ITheme } from '@/types';
import { Params } from 'react-router';

export async function loader({
  params,
  sessionsService,
  themesService,
}: {
  params: Params;
  sessionsService: SessionsService;
  themesService: ThemesService;
}) {
  const sessionPromise = sessionsService.getBySecret(
    Number(params.orgId),
    Number(params.sessionId),
    params.secret,
  );

  let themes: ITheme[] = [];
  if (!isBaseTheme(params.theme)) {
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
  };
}
