import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { AuthLayout } from './components/AuthLayout';
import { TodayPage } from './pages/TodayPage';

/*
 * Today is the start page and loads with the app. Every other page is a separate chunk,
 * loaded on first visit (and preloaded for the opened URL by build/routePreload.ts).
 * Declarative routing keeps React Router's share of the first load small (TDD §14.6).
 */
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const SectionPage = lazy(() =>
  import('./pages/SectionPage').then((m) => ({ default: m.SectionPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

const SECTIONS = ['habits', 'missions', 'calendar', 'analytics'] as const;

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        {SECTIONS.map((section) => (
          <Route key={section} path={section} element={<SectionPage section={section} />} />
        ))}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
