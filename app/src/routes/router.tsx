import {
  LoaderFunctionArgs,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from "react-router-dom";

import AuthLayout from "@/layouts/auth";
import AppLayout, { loader as appLoader } from "@/layouts/app";
import ErrorLayout from "@/layouts/error";
import ControllerLayout from "@/layouts/controller";
import { useServices, ServicesProviderState } from "@/hooks/services.provider";

import Home from "./home";
import SignUp from "./signup";
import Login from "./login";

import Welcome from "./app/welcome";
import Controller from "./app/controller";
import Profile, { loader as profileLoader } from "./app/profile";

import SongsIndex, { loader as indexSongLoader } from "./app/songs/index";
import EditSong, { loader as editSongLoader } from "./app/songs/edit";

import OrganizationsIndex, { loader as indexOrganizationLoader } from "./app/organizations/index";
import EditOrganization, { loader as editOrganizationLoader } from "./app/organizations/edit";

export const buildRouter = (services: ServicesProviderState) => {

  return createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" errorElement={<ErrorLayout />}>
          <Route index={true} element={<Home />} />
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
          </Route>
        </Route>
        <Route path="/app" element={<AppLayout />} errorElement={<ErrorLayout />} loader={() => appLoader({ usersService: services.usersService })}>
          <Route index={true} element={<Welcome />} />
          <Route path="profile" element={<Profile />} loader={() => profileLoader({ usersService: services.usersService })} />
          <Route path="songs">
            <Route index={true} element={<SongsIndex />} loader={() => indexSongLoader({ songsService: services.songsService })} />
            <Route path="add" element={<EditSong edit={false} />} />
            <Route path=":id/edit" element={<EditSong />} loader={(loader: LoaderFunctionArgs) => editSongLoader({ params: loader.params, songsService: services.songsService })} />
          </Route>
          <Route path="organizations">
            <Route index={true} element={<OrganizationsIndex />} loader={() => indexOrganizationLoader({ usersService: services.usersService })} />
            <Route path="add" element={<EditOrganization edit={false} />} />
            <Route path=":id/edit" element={<EditOrganization />} loader={(loader: LoaderFunctionArgs) => editOrganizationLoader({ params: loader.params, organizationsService: services.organizationsService })} />
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
