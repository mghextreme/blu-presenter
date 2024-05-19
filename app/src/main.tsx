import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from "react-router-dom";

import { ThemeProvider } from "@/hooks/theme.provider";
import { SupabaseProvider } from '@/hooks/supabase.provider';
import { router } from './routes/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseProvider>
      <ThemeProvider defaultTheme="dark">
        <RouterProvider router={router} />
      </ThemeProvider>
    </SupabaseProvider>
  </React.StrictMode>,
)
