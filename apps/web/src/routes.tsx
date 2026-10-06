import type { RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { AuthLayout } from './components/AuthLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { SectionPage } from './pages/SectionPage';
import { TodayPage } from './pages/TodayPage';

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'habits', element: <SectionPage section="habits" /> },
      { path: 'missions', element: <SectionPage section="missions" /> },
      { path: 'calendar', element: <SectionPage section="calendar" /> },
      { path: 'analytics', element: <SectionPage section="analytics" /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
