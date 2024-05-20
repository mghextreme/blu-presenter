import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'

import { ThemeProvider } from "@/hooks/theme.provider";
import { SupabaseProvider } from '@/hooks/supabase.provider';
import { ServicesProvider } from '@/hooks/services.provider';
import AppRouter from './routes/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseProvider>
      <ServicesProvider>
        <ThemeProvider defaultTheme="dark">
          <AppRouter></AppRouter>
        </ThemeProvider>
      </ServicesProvider>
    </SupabaseProvider>
  </React.StrictMode>,
)
