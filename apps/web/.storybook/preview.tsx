import '@fontsource/noto-sans-georgian/georgian-400.css';
import '@fontsource/noto-sans-georgian/georgian-600.css';
import '@fontsource/noto-sans-georgian/georgian-700.css';
import '@fontsource/noto-sans-georgian/georgian-800.css';
import '@fontsource/noto-sans-georgian/latin-400.css';
import '@fontsource/noto-sans-georgian/latin-600.css';
import '@fontsource/noto-sans-georgian/latin-700.css';
import '@fontsource/noto-sans-georgian/latin-800.css';
import '../src/styles/index.css';
import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
import i18n from '../src/i18n';
import { ToastProvider } from '../src/components/ui/Toast';

/**
 * Every story can be checked in light/dark and Georgian/English from the toolbar
 * (TDD §14.6: all 4 combinations are reviewed before a component is accepted).
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Language',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: 'ka', title: 'ქართული' },
          { value: 'en', title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', locale: 'ka' },
  parameters: {
    layout: 'padded',
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, context) => {
      const { theme, locale } = context.globals as { theme: 'light' | 'dark'; locale: 'ka' | 'en' };
      useEffect(() => {
        document.documentElement.dataset.theme = theme;
      }, [theme]);
      useEffect(() => {
        void i18n.changeLanguage(locale);
      }, [locale]);
      return (
        <MemoryRouter>
          <ToastProvider>
            <div className="min-h-[200px] bg-bg p-6 text-fg">
              <Story />
            </div>
          </ToastProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default preview;
