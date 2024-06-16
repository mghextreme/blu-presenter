import './index.css';

import React from 'react'
import ReactDOM from 'react-dom/client'

import { ServicesProvider } from '@/hooks/services.provider';
import AppRouter from './routes/router';

import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServicesProvider>
      <AppRouter></AppRouter>
    </ServicesProvider>
  </React.StrictMode>,
)
