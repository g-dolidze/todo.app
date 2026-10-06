import '@fontsource/noto-sans-georgian/georgian-400.css';
import '@fontsource/noto-sans-georgian/georgian-600.css';
import '@fontsource/noto-sans-georgian/georgian-700.css';
import '@fontsource/noto-sans-georgian/georgian-800.css';
import '@fontsource/noto-sans-georgian/latin-400.css';
import '@fontsource/noto-sans-georgian/latin-600.css';
import '@fontsource/noto-sans-georgian/latin-700.css';
import '@fontsource/noto-sans-georgian/latin-800.css';
import './styles/index.css';
import './i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AppProviders } from './App';
import { AppRoutes } from './routes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
