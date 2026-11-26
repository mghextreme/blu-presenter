import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'

import { QueryClientProvider } from '@tanstack/react-query';
import { createAppQueryClient } from '@/lib/query-client';
import { ServicesProvider } from '@/hooks/services.provider';
import { PwaManager } from '@/components/shared/pwa-manager';

import { AppRouter } from './routes/router';

import './i18n';

const queryClient = createAppQueryClient();

// After a deploy, open tabs request page chunks that no longer exist; reload to get the new build.
window.addEventListener('vite:preloadError', () => window.location.reload());

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
