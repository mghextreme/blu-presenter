import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import AppLayout from "./layouts/app";
import ErrorLayout from "./layouts/error";
import ControllerLayout from "./layouts/controller";

import Welcome from "./routes/welcome";
import Controller from "./routes/controller";

import SongsIndex from "./routes/songs/index";
import EditSong, { loader as editSongLoader } from "./routes/songs/edit";

import ThemeProvider from "@/components/theme-provider";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        errorElement: <ErrorLayout />,
        children: [
          { index: true, element: <Welcome /> },
          {
            path: "songs",
            children: [
              { index: true, element: <SongsIndex /> },
              {
                path: ":id/edit",
                element: <EditSong />,
                loader: editSongLoader,
              },
            ]
          },
        ],
      },
    ],
  },
  {
    path: "/controller",
    element: <ControllerLayout />,
    children: [
      {
        errorElement: <ErrorLayout />,
        children: [
          { index: true, element: <Controller /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
