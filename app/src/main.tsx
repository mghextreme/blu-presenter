import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'

import { SupabaseProvider } from '@/hooks/supabase.provider';
import { ServicesProvider } from '@/hooks/services.provider';
import AppRouter from './routes/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseProvider>
      <ServicesProvider>
        <AppRouter></AppRouter>
      </ServicesProvider>
    </SupabaseProvider>
  </React.StrictMode>,
)
