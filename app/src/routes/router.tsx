import {
  LoaderFunctionArgs,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from "react-router-dom";

import AuthLayout from "@/layouts/auth";
import { loader as authLoader } from "@/layouts/auth.loader";
import AppLayout from "@/layouts/app";
import AppSharedLayout from "@/layouts/app-shared";
import PublicPagesLayout from "@/layouts/public-pages";
import ErrorLayout from "@/layouts/error";
import ControllerLayout from "@/layouts/controller";
import ControllerSharedLayout from "@/layouts/controller-shared";
import { loader as publicSessionLoader } from "./app/public-session.loader";
import PrintLayout from "@/layouts/print";
import { useServices } from "@/hooks/useServices";

import Home from "./home";
import OpenSource from "./open-source";
import PrivacyPolicy from "./privacy-policy";
import TermsAndConditions from "./terms-and-conditions";

import SignUp from "./auth/signup";
import Login from "./auth/login";
import OAuthCallback from "./auth/oauth-callback";

import Welcome from "./app/welcome";
import { loader as welcomeLoader } from "./app/welcome.loader";
import Controller from "./app/controller";
import Receiver from "./app/receiver";
import Discover from "./app/discover";
import Profile from "./app/profile";
import { loader as profileLoader } from "./app/profile.loader";

import SongsIndex from "./app/songs/index";
import EditSong from "./app/songs/edit";
import ViewSong from "./app/songs/view";
import PrintSong from "./app/songs/print";
import { loader as singleSongLoader } from "./app/songs/single.loader";
import { loader as allSongsLoader } from "./app/songs/all.loader";

import ThemesIndex from "./app/themes/index";
import EditTheme from "./app/themes/edit";
import { loader as singleThemeLoader } from "./app/themes/single.loader";
import { loader as allThemesLoader } from "./app/themes/all.loader";

import SessionsIndex from "./app/sessions/index";
import EditSession from "./app/sessions/edit";
import { loader as singleSessionLoader } from "./app/sessions/single.loader";
import { loader as allSessionsLoader } from "./app/sessions/all.loader";

import EditOrganization from "./app/organizations/index";
import { loader as editOrganizationLoader } from "./app/organizations/index.loader"
import InviteOrganizationMember, { loader as inviteOrganizationMemberLoader } from "./app/organizations/invite";
import EditMember, { loader as editMemberLoader } from "./app/organizations/editMember";
import TransferOrganization from "./app/organizations/transfer";
import ImportSong from "./app/songs/import";

export default function AppRouter() {

  const services = useServices();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<PublicPagesLayout />} errorElement={<ErrorLayout />}>
          <Route index={true} element={<Home />} />
          <Route path="open-source" element={<OpenSource />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-and-conditions" element={<TermsAndConditions />} />
        </Route>
        <Route element={<AuthLayout />} errorElement={<ErrorLayout />} loader={(loader: LoaderFunctionArgs) => authLoader({ request: loader.request, organizationsService: services.organizationsService })}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Route>
        <Route path="/app" element={<AppLayout />} errorElement={<ErrorLayout />}>
          <Route index={true} element={<Welcome />} loader={() => welcomeLoader({ organizationsService: services.organizationsService })} />
          <Route path="profile" element={<Profile />} loader={() => profileLoader({ usersService: services.usersService })} />
          <Route path="songs">
            <Route index={true} element={<SongsIndex />} loader={() => allSongsLoader({ songsService: services.songsService })} />
            <Route path="add" element={<EditSong edit={false} />} />
            <Route path="import" element={<ImportSong />} />
            <Route path=":id/view" element={<ViewSong />} loader={(loader: LoaderFunctionArgs) => singleSongLoader({ params: loader.params, songsService: services.songsService })} />
            <Route path=":id/edit" element={<EditSong />} loader={(loader: LoaderFunctionArgs) => singleSongLoader({ params: loader.params, songsService: services.songsService })} />
          </Route>
          <Route path="discover" element={<Discover />} />
          <Route path="organization">
            <Route index={true} element={<EditOrganization />} loader={() => editOrganizationLoader({ organizationsService: services.organizationsService })} />
            <Route path="invite" element={<InviteOrganizationMember />} loader={() => inviteOrganizationMemberLoader({ organizationsService: services.organizationsService })} />
            <Route path="member/:id" element={<EditMember />} loader={(loader: LoaderFunctionArgs) => editMemberLoader({ params: loader.params, organizationsService: services.organizationsService })} />
            <Route path="transfer" element={<TransferOrganization />} loader={() => editOrganizationLoader({ organizationsService: services.organizationsService })} />
          </Route>
          <Route path="organizations">
            <Route path="add" element={<EditOrganization edit={false} />} />
          </Route>
          <Route path="themes">
            <Route index={true} element={<ThemesIndex />} loader={() => allThemesLoader({ themesService: services.themesService })} />
            <Route path="add" element={<EditTheme edit={false} />} />
            <Route path=":id/edit" element={<EditTheme />} loader={(loader: LoaderFunctionArgs) => singleThemeLoader({ params: loader.params, themesService: services.themesService })} />
          </Route>
          <Route path="sessions">
            <Route index={true} element={<SessionsIndex />} loader={() => allSessionsLoader({ sessionsService: services.sessionsService })} />
            <Route path="add" element={<EditSession edit={false} />} />
            <Route path=":id/edit" element={<EditSession />} loader={(loader: LoaderFunctionArgs) => singleSessionLoader({ params: loader.params, sessionsService: services.sessionsService })} />
          </Route>
        </Route>
        <Route path="/app" element={<PrintLayout />} errorElement={<ErrorLayout />}>
          <Route path="songs/:id/print" element={<PrintSong />} loader={(loader: LoaderFunctionArgs) => singleSongLoader({ params: loader.params, songsService: services.songsService })} />
        </Route>
        <Route path="/app/controller" element={<ControllerLayout />} errorElement={<ErrorLayout />}>
          <Route index={true} element={<Controller />} />
        </Route>
        <Route path="/shared" element={<PrintLayout />} errorElement={<ErrorLayout />}>
          <Route path="print/:id">
            <Route index={true} element={<PrintSong />} loader={(loader: LoaderFunctionArgs) => singleSongLoader({ params: loader.params, songsService: services.songsService })} />
            <Route path=":secret" element={<PrintSong />} loader={(loader: LoaderFunctionArgs) => singleSongLoader({ params: loader.params, songsService: services.songsService, secret: loader.params.secret })} />
          </Route>
        </Route>
        <Route path="/shared" element={<AppSharedLayout />} errorElement={<ErrorLayout />}>
          <Route path="view/:id">
            <Route index={true} element={<ViewSong />} loader={(loader: LoaderFunctionArgs) => singleSongLoader({ params: loader.params, songsService: services.songsService })} />
            <Route path=":secret" element={<ViewSong />} loader={(loader: LoaderFunctionArgs) => singleSongLoader({ params: loader.params, songsService: services.songsService, secret: loader.params.secret })} />
          </Route>
        </Route>
        <Route path="/shared" element={<ControllerSharedLayout />} errorElement={<ErrorLayout />}>
          <Route path="session/:orgId/:sessionId/:secret">
            <Route index={true} element={<Receiver />} loader={(loader: LoaderFunctionArgs) => publicSessionLoader({ params: loader.params, sessionsService: services.sessionsService, themesService: services.themesService })} />
            <Route path=":theme" element={<Receiver />} loader={(loader: LoaderFunctionArgs) => publicSessionLoader({ params: loader.params, sessionsService: services.sessionsService, themesService: services.themesService })} />
          </Route>
        </Route>
      </>
    )
  );

  return (
    <RouterProvider router={router} />
  )
}
