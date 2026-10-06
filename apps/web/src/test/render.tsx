import { render } from '@testing-library/react';
import { MemoryRouter, useLocation, type Location } from 'react-router';
import { AppProviders } from '../App';
import { AppRoutes } from '../routes';

/** Renders the whole app at `path`. `router.state.location` always holds the current URL. */
export function renderApp(path = '/') {
  const router = { state: { location: { pathname: path } as Location } };
  function LocationProbe() {
    router.state.location = useLocation();
    return null;
  }
  return {
    router,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <AppProviders>
          <AppRoutes />
          <LocationProbe />
        </AppProviders>
      </MemoryRouter>,
    ),
  };
}
