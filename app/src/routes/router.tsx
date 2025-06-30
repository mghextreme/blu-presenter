import {
  LoaderFunctionArgs,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from "react-router-dom";

import AuthLayout from "@/layouts/auth";
import { loader as authLoader } from "@/layouts/auth.loader"
import AppLayout from "@/layouts/app";
import ErrorLayout from "@/layouts/error";
import ControllerLayout from "@/layouts/controller";
import { useServices, ServicesProviderState } from "@/hooks/services.provider";

import Home from "./home";
import SignUp from "./auth/signup";
import Login from "./auth/login";
import OAuthCallback from "./auth/oauth-callback";

import Welcome from "./app/welcome";
import { loader as welcomeLoader } from "./app/welcome.loader";
import Controller from "./app/controller";
import Discover from "./app/discover";
import Profile from "./app/profile";
import { loader as profileLoader } from "./app/profile.loader";

import SongsIndex, { loader as indexSongLoader } from "./app/songs/index";
import EditSong, { loader as editSongLoader } from "./app/songs/edit";

import EditOrganization from "./app/organizations/index";
import { loader as editOrganizationLoader } from "./app/organizations/index.loader"
import InviteOrganizationMember, { loader as inviteOrganizationMemberLoader } from "./app/organizations/invite";
import EditMember, { loader as editMemberLoader } from "./app/organizations/editMember";

export const buildRouter = (services: ServicesProviderState) => {

  return createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" errorElement={<ErrorLayout />}>
          <Route index={true} element={<Home />} />
          <Route element={<AuthLayout />} loader={(loader: LoaderFunctionArgs) => authLoader({ request: loader.request, organizationsService: services.organizationsService })}>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="oauth/callback" element={<OAuthCallback />} />
          </Route>
        </Route>
        <Route path="/app" element={<AppLayout />} errorElement={<ErrorLayout />}>
          <Route index={true} element={<Welcome />} loader={() => welcomeLoader({ organizationsService: services.organizationsService })} />
          <Route path="profile" element={<Profile />} loader={() => profileLoader({ usersService: services.usersService })} />
          <Route path="songs">
            <Route index={true} element={<SongsIndex />} loader={() => indexSongLoader({ songsService: services.songsService })} />
            <Route path="add" element={<EditSong edit={false} />} />
            <Route path=":id/edit" element={<EditSong />} loader={(loader: LoaderFunctionArgs) => editSongLoader({ params: loader.params, songsService: services.songsService })} />
          </Route>
          <Route path="discover" element={<Discover />} />
          <Route path="organization">
            <Route index={true} element={<EditOrganization />} loader={() => editOrganizationLoader({ organizationsService: services.organizationsService })} />
            <Route path="invite" element={<InviteOrganizationMember />} loader={() => inviteOrganizationMemberLoader({ organizationsService: services.organizationsService })} />
            <Route path="member/:id" element={<EditMember />} loader={(loader: LoaderFunctionArgs) => editMemberLoader({ params: loader.params, organizationsService: services.organizationsService })} />
          </Route>
          <Route path="organizations">
            <Route path="add" element={<EditOrganization edit={false} />} />
          </Route>
        </Route>
        <Route path="/app/controller" element={<ControllerLayout />} errorElement={<ErrorLayout />}>
          <Route index={true} element={<Controller />} />
        </Route>
      </>
    )
  );
}

export default function AppRouter() {

  const services = useServices();

  return (
    <RouterProvider router={buildRouter(services)} />
  )
}
