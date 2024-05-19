import {
  Route,
  createBrowserRouter,
  createRoutesFromElements
} from "react-router-dom";

import AuthLayout from "@/layouts/auth";
import AuthWrapperLayout from "@/layouts/auth-wrapper";
import AppLayout from "@/layouts/app";
import ErrorLayout from "@/layouts/error";
import ControllerLayout from "@/layouts/controller";

import Home from "./home";
import SignUp from "./signup";
import Login from "./login";

import Welcome from "./app/welcome";
import Controller from "./app/controller";

import SongsIndex, { loader as indexSongLoader } from "./songs/index";
import EditSong, { loader as editSongLoader } from "./songs/edit";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AuthWrapperLayout />}>
      <Route path="/" errorElement={<ErrorLayout />}>
        <Route index={true} element={<Home />} />
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<SignUp />} />
        </Route>
      </Route>
      <Route path="/app" element={<AppLayout />} errorElement={<ErrorLayout />}>
        <Route index={true} element={<Welcome />} />
        <Route path="songs">
          <Route index={true} element={<SongsIndex />} loader={indexSongLoader} />
          <Route path=":id/edit" element={<EditSong />} loader={editSongLoader} />
        </Route>
      </Route>
      <Route path="/app/controller" element={<ControllerLayout />} errorElement={<ErrorLayout />}>
        <Route index={true} element={<Controller />} />
      </Route>
    </Route>
  )
);
