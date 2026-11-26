import {
  LoaderFunctionArgs,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import { AuthLayout } from '@/layouts/auth';
import { loader as authLoader } from '@/layouts/auth.loader';
import { AppLayout } from '@/layouts/app';
import { AppSharedLayout } from '@/layouts/app-shared';
import { PublicPagesLayout } from '@/layouts/public-pages';
import { ErrorLayout } from '@/layouts/error';
import { ControllerLayout } from '@/layouts/controller';
import { ControllerSharedLayout } from '@/layouts/controller-shared';
import { loader as publicSessionLoader } from './app/public-session.loader';
import { PrintLayout } from '@/layouts/print';
import { useServices } from '@/hooks/useServices';

import { loader as welcomeLoader } from './app/welcome.loader';
import { loader as profileLoader } from './app/profile.loader';

import { loader as singleSongLoader } from './app/songs/single.loader';
import { loader as allSongsLoader } from './app/songs/all.loader';

import { loader as singleThemeLoader } from './app/themes/single.loader';
import { loader as allThemesLoader } from './app/themes/all.loader';

import { loader as singleSessionLoader } from './app/sessions/single.loader';
import { loader as allSessionsLoader } from './app/sessions/all.loader';

import { loader as singleScheduleLoader } from './app/schedules/single.loader';
import { loader as allSchedulesLoader } from './app/schedules/all.loader';

import { loader as editOrganizationLoader } from './app/organizations/index.loader';
import { loader as inviteOrganizationMemberLoader } from './app/organizations/invite.loader';
import { loader as editMemberLoader } from './app/organizations/editMember.loader';

export function AppRouter() {
  const services = useServices();
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  // Created once: rebuilding the router on re-render (e.g. a language change
  // re-renders this component through useTranslation) remounts the whole tree,
  // which resets the controller state and closes the projector windows.
  // Loaders read the language from the i18next instance when they run, not
  // from `i18n` above: react-i18next returns a new `i18n` wrapper object on
  // every language change, so it cannot be a dependency here.
  const router = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <>
            <Route path="/" element={<PublicPagesLayout />} errorElement={<ErrorLayout />}>
              <Route
                index={true}
                lazy={() => import('./home').then((m) => ({ element: <m.Home /> }))}
              />
              <Route
                path="open-source"
                lazy={() => import('./open-source').then((m) => ({ element: <m.OpenSource /> }))}
              />
              <Route
                path="privacy-policy"
                lazy={() =>
                  import('./privacy-policy').then((m) => ({ element: <m.PrivacyPolicy /> }))
                }
              />
              <Route
                path="terms-and-conditions"
                lazy={() =>
                  import('./terms-and-conditions').then((m) => ({
                    element: <m.TermsAndConditions />,
                  }))
                }
              />
            </Route>
            <Route
              element={<AuthLayout />}
              errorElement={<ErrorLayout />}
              loader={(loader: LoaderFunctionArgs) =>
                authLoader({
                  request: loader.request,
                  organizationsService: services.organizationsService,
                })
              }
            >
              <Route
                path="/login"
                lazy={() => import('./auth/login').then((m) => ({ element: <m.Login /> }))}
              />
              <Route
                path="/signup"
                lazy={() => import('./auth/signup').then((m) => ({ element: <m.SignUp /> }))}
              />
              <Route
                path="/forgot-password"
                lazy={() =>
                  import('./auth/forgot-password').then((m) => ({ element: <m.ForgotPassword /> }))
                }
              />
              <Route
                path="/reset-password"
                lazy={() =>
                  import('./auth/reset-password').then((m) => ({ element: <m.ResetPassword /> }))
                }
              />
              <Route
                path="/login/otp"
                lazy={() =>
                  import('./auth/otp-request').then((m) => ({ element: <m.OtpRequest /> }))
                }
              />
              <Route
                path="/login/otp/verify"
                lazy={() => import('./auth/otp-verify').then((m) => ({ element: <m.OtpVerify /> }))}
              />
              <Route
                path="/oauth/callback"
                lazy={() =>
                  import('./auth/oauth-callback').then((m) => ({ element: <m.OAuthCallback /> }))
                }
              />
              <Route
                path="/oauth/link-callback"
                lazy={() =>
                  import('./auth/oauth-link-callback').then((m) => ({
                    element: <m.OAuthLinkCallback />,
                  }))
                }
              />
            </Route>
            <Route path="/app" element={<AppLayout />} errorElement={<ErrorLayout />}>
              <Route
                index={true}
                lazy={() => import('./app/welcome').then((m) => ({ element: <m.Welcome /> }))}
                loader={() =>
                  welcomeLoader({ organizationsService: services.organizationsService })
                }
              />
              <Route
                path="profile"
                lazy={() => import('./app/profile').then((m) => ({ element: <m.Profile /> }))}
                loader={() =>
                  profileLoader({
                    usersService: services.usersService,
                    authService: services.authService,
                  })
                }
              />
              <Route
                path="spotify/connect-callback"
                lazy={() =>
                  import('./app/playlist-connect-callback').then((m) => ({
                    element: <m.SpotifyConnectCallback />,
                  }))
                }
              />
              <Route
                path="youtube/connect-callback"
                lazy={() =>
                  import('./app/playlist-connect-callback').then((m) => ({
                    element: <m.YoutubeConnectCallback />,
                  }))
                }
              />
              <Route path="songs">
                <Route
                  index={true}
                  lazy={() => import('./app/songs').then((m) => ({ element: <m.Songs /> }))}
                  loader={() =>
                    allSongsLoader({ songsService: services.songsService, lang: i18next.language })
                  }
                />
                <Route
                  path="add"
                  lazy={() =>
                    import('./app/songs/edit').then((m) => ({
                      element: <m.EditSong edit={false} />,
                    }))
                  }
                />
                <Route
                  path="import"
                  lazy={() =>
                    import('./app/songs/import').then((m) => ({ element: <m.ImportSong /> }))
                  }
                />
                <Route
                  path=":id/view"
                  lazy={() => import('./app/songs/view').then((m) => ({ element: <m.ViewSong /> }))}
                  loader={(loader: LoaderFunctionArgs) =>
                    singleSongLoader({ params: loader.params, songsService: services.songsService })
                  }
                />
                <Route
                  path=":id/edit"
                  lazy={() => import('./app/songs/edit').then((m) => ({ element: <m.EditSong /> }))}
                  loader={(loader: LoaderFunctionArgs) =>
                    singleSongLoader({ params: loader.params, songsService: services.songsService })
                  }
                />
              </Route>
              <Route path="organization">
                <Route
                  index={true}
                  lazy={() =>
                    import('./app/organizations/redirect').then((m) => ({
                      element: <m.OrganizationRedirect />,
                    }))
                  }
                />
                <Route
                  path=":orgId"
                  lazy={() =>
                    import('./app/organizations/index').then((m) => ({
                      element: <m.EditOrganization />,
                    }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    editOrganizationLoader({
                      organizationsService: services.organizationsService,
                      orgId: Number(loader.params.orgId),
                    })
                  }
                />
                <Route
                  path=":orgId/invite"
                  lazy={() =>
                    import('./app/organizations/invite').then((m) => ({
                      element: <m.InviteOrganizationMember />,
                    }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    inviteOrganizationMemberLoader({
                      organizationsService: services.organizationsService,
                      orgId: Number(loader.params.orgId),
                    })
                  }
                />
                <Route
                  path=":orgId/member/:id"
                  lazy={() =>
                    import('./app/organizations/editMember').then((m) => ({
                      element: <m.EditMember />,
                    }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    editMemberLoader({
                      params: loader.params,
                      organizationsService: services.organizationsService,
                      orgId: Number(loader.params.orgId),
                    })
                  }
                />
                <Route
                  path=":orgId/transfer"
                  lazy={() =>
                    import('./app/organizations/transfer').then((m) => ({
                      element: <m.TransferOrganization />,
                    }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    editOrganizationLoader({
                      organizationsService: services.organizationsService,
                      orgId: Number(loader.params.orgId),
                    })
                  }
                />
              </Route>
              <Route path="organizations">
                <Route
                  path="add"
                  lazy={() =>
                    import('./app/organizations/index').then((m) => ({
                      element: <m.EditOrganization edit={false} />,
                    }))
                  }
                />
              </Route>
              <Route path="themes">
                <Route
                  index={true}
                  lazy={() => import('./app/themes/index').then((m) => ({ element: <m.Themes /> }))}
                  loader={() => allThemesLoader({ themesService: services.themesService })}
                />
                <Route
                  path="add"
                  lazy={() =>
                    import('./app/themes/edit').then((m) => ({
                      element: <m.EditTheme edit={false} />,
                    }))
                  }
                />
                <Route
                  path=":id/edit"
                  lazy={() =>
                    import('./app/themes/edit').then((m) => ({ element: <m.EditTheme /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleThemeLoader({
                      params: loader.params,
                      themesService: services.themesService,
                    })
                  }
                />
              </Route>
              <Route path="sessions">
                <Route
                  index={true}
                  lazy={() =>
                    import('./app/sessions/index').then((m) => ({ element: <m.Sessions /> }))
                  }
                  loader={() => allSessionsLoader({ sessionsService: services.sessionsService })}
                />
                <Route
                  path="add"
                  lazy={() =>
                    import('./app/sessions/edit').then((m) => ({
                      element: <m.EditSession edit={false} />,
                    }))
                  }
                />
                <Route
                  path=":id/edit"
                  lazy={() =>
                    import('./app/sessions/edit').then((m) => ({ element: <m.EditSession /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleSessionLoader({
                      params: loader.params,
                      sessionsService: services.sessionsService,
                    })
                  }
                />
              </Route>
              <Route path="schedules">
                <Route
                  index={true}
                  lazy={() =>
                    import('./app/schedules/index').then((m) => ({ element: <m.Schedules /> }))
                  }
                  loader={() => allSchedulesLoader({ schedulesService: services.schedulesService })}
                />
                <Route
                  path="add"
                  lazy={() =>
                    import('./app/schedules/edit').then((m) => ({
                      element: <m.EditSchedule edit={false} />,
                    }))
                  }
                />
                <Route
                  path=":id/view"
                  lazy={() =>
                    import('./app/schedules/view').then((m) => ({ element: <m.ViewSchedule /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleScheduleLoader({
                      params: loader.params,
                      schedulesService: services.schedulesService,
                    })
                  }
                />
                <Route
                  path=":id/rehearsal"
                  lazy={() =>
                    import('./app/schedules/rehearsal').then((m) => ({
                      element: <m.RehearsalSchedule />,
                    }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleScheduleLoader({
                      params: loader.params,
                      schedulesService: services.schedulesService,
                    })
                  }
                />
                <Route
                  path=":id/edit"
                  lazy={() =>
                    import('./app/schedules/edit').then((m) => ({ element: <m.EditSchedule /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleScheduleLoader({
                      params: loader.params,
                      schedulesService: services.schedulesService,
                    })
                  }
                />
              </Route>
            </Route>
            <Route path="/app" element={<PrintLayout />} errorElement={<ErrorLayout />}>
              <Route
                path="songs/:id/print"
                lazy={() => import('./app/songs/print').then((m) => ({ element: <m.PrintSong /> }))}
                loader={(loader: LoaderFunctionArgs) =>
                  singleSongLoader({ params: loader.params, songsService: services.songsService })
                }
              />
            </Route>
            <Route
              path="/app/controller"
              element={<ControllerLayout />}
              errorElement={<ErrorLayout />}
            >
              <Route
                index={true}
                lazy={() => import('./app/controller').then((m) => ({ element: <m.Controller /> }))}
              />
            </Route>
            <Route path="/shared" element={<PrintLayout />} errorElement={<ErrorLayout />}>
              <Route path="print/:id">
                <Route
                  index={true}
                  lazy={() =>
                    import('./app/songs/print').then((m) => ({ element: <m.PrintSong /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleSongLoader({ params: loader.params, songsService: services.songsService })
                  }
                />
                <Route
                  path=":secret"
                  lazy={() =>
                    import('./app/songs/print').then((m) => ({ element: <m.PrintSong /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleSongLoader({
                      params: loader.params,
                      songsService: services.songsService,
                      secret: loader.params.secret,
                    })
                  }
                />
              </Route>
            </Route>
            <Route path="/shared" element={<AppSharedLayout />} errorElement={<ErrorLayout />}>
              <Route path="view/:id">
                <Route
                  index={true}
                  lazy={() => import('./app/songs/view').then((m) => ({ element: <m.ViewSong /> }))}
                  loader={(loader: LoaderFunctionArgs) =>
                    singleSongLoader({ params: loader.params, songsService: services.songsService })
                  }
                />
                <Route
                  path=":secret"
                  lazy={() => import('./app/songs/view').then((m) => ({ element: <m.ViewSong /> }))}
                  loader={(loader: LoaderFunctionArgs) =>
                    singleSongLoader({
                      params: loader.params,
                      songsService: services.songsService,
                      secret: loader.params.secret,
                    })
                  }
                />
              </Route>
              <Route path="schedules/:id/">
                <Route
                  index={true}
                  lazy={() =>
                    import('./app/schedules/view').then((m) => ({ element: <m.ViewSchedule /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleScheduleLoader({
                      params: loader.params,
                      schedulesService: services.schedulesService,
                    })
                  }
                />
                <Route
                  path=":secret"
                  lazy={() =>
                    import('./app/schedules/view').then((m) => ({ element: <m.ViewSchedule /> }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleScheduleLoader({
                      params: loader.params,
                      schedulesService: services.schedulesService,
                      secret: loader.params.secret,
                    })
                  }
                />
                <Route
                  path=":secret/rehearsal"
                  lazy={() =>
                    import('./app/schedules/rehearsal').then((m) => ({
                      element: <m.RehearsalSchedule />,
                    }))
                  }
                  loader={(loader: LoaderFunctionArgs) =>
                    singleScheduleLoader({
                      params: loader.params,
                      schedulesService: services.schedulesService,
                      secret: loader.params.secret,
                    })
                  }
                />
              </Route>
            </Route>
            <Route
              path="/shared"
              element={<ControllerSharedLayout />}
              errorElement={<ErrorLayout />}
            >
              <Route path="session/:orgId/:sessionId/:secret">
                <Route
                  index={true}
                  lazy={() => import('./app/receiver').then((m) => ({ element: <m.Receiver /> }))}
                  loader={(loader: LoaderFunctionArgs) =>
                    publicSessionLoader({
                      params: loader.params,
                      sessionsService: services.sessionsService,
                      themesService: services.themesService,
                    })
                  }
                />
                <Route
                  path=":theme"
                  lazy={() => import('./app/receiver').then((m) => ({ element: <m.Receiver /> }))}
                  loader={(loader: LoaderFunctionArgs) =>
                    publicSessionLoader({
                      params: loader.params,
                      sessionsService: services.sessionsService,
                      themesService: services.themesService,
                    })
                  }
                />
              </Route>
            </Route>
          </>,
        ),
      ),
    [services],
  );

  return <RouterProvider router={router} />;
}
