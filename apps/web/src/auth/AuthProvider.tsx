import type {
  AuthResponse,
  ChangePasswordInput,
  DeleteMeInput,
  LoginInput,
  RegisterInput,
  UpdateMeInput,
  UserDto,
} from '@progress/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch, hasSessionHint, json, refreshSession, session } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../theme/ThemeProvider';

type Status = 'loading' | 'authenticated' | 'guest';

interface AuthContextValue {
  status: Status;
  user: UserDto | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateMe: (input: UpdateMeInput) => Promise<UserDto>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  deleteAccount: (input: DeleteMeInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<UserDto | null>(null);
  const queryClient = useQueryClient();
  const { setPreference } = useTheme();
  const { i18n, t } = useTranslation();
  const toast = useToast();
  const started = useRef(false);

  /** The server profile is the source of truth for theme and language (TDD §12, §11.5). */
  const applyUser = useCallback(
    (next: UserDto) => {
      setUser(next);
      setStatus('authenticated');
      setPreference(next.theme);
      if (i18n.language !== next.locale) void i18n.changeLanguage(next.locale);
    },
    [i18n, setPreference],
  );

  const startSession = useCallback(
    (response: AuthResponse) => {
      session.set(response.accessToken);
      applyUser(response.user);
    },
    [applyUser],
  );

  const endSession = useCallback(() => {
    session.set(null);
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  // Restore the session from the refresh cookie once, when the app opens.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Guests have no session cookie: don't make a request that can only fail.
    if (!hasSessionHint()) {
      setStatus('guest');
      return;
    }
    refreshSession()
      .then(startSession)
      .catch(() => setStatus('guest'));
  }, [startSession]);

  // Logged out elsewhere or the session expired while the app was open.
  useEffect(
    () =>
      session.onExpired(() => {
        endSession();
        toast(t('auth.sessionEnded'), 'error');
      }),
    [endSession, t, toast],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login: async (input) =>
        startSession(
          await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: json(input) }),
        ),
      register: async (input) =>
        startSession(
          await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: json(input) }),
        ),
      logout: async () => {
        await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
        endSession();
      },
      updateMe: async (input) => {
        const updated = await apiFetch<UserDto>('/me', { method: 'PATCH', body: json(input) });
        setUser(updated);
        return updated;
      },
      changePassword: (input) =>
        apiFetch<void>('/me/password', { method: 'PUT', body: json(input) }),
      deleteAccount: async (input) => {
        await apiFetch<void>('/me', { method: 'DELETE', body: json(input) });
        endSession();
      },
    }),
    [status, user, startSession, endSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
