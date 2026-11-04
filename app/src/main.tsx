import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServicesProvider } from '@/hooks/services.provider';
import { PwaManager } from '@/components/shared/pwa-manager';

import { AppRouter } from './routes/router';

import './i18n';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServicesProvider queryClient={queryClient}>
        <AppRouter></AppRouter>
        <PwaManager />
      </ServicesProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
