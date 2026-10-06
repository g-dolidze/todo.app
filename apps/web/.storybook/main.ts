import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  core: { disableTelemetry: true },
  // Route preloading is for the app's index.html only.
  viteFinal: (config) => ({
    ...config,
    plugins: (config.plugins ?? []).filter(
      (plugin) => !(plugin && 'name' in plugin && plugin.name === 'progress:route-preload'),
    ),
  }),
};

export default config;
