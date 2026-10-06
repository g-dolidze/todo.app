import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@progress/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { applyServerErrors, errorKey } from '../auth/forms';
import { Card } from '../components/Card';
import { FormAlert } from '../components/ui/FormAlert';
import { Button } from '../components/ui/Button';
import { PasswordField, TextField } from '../components/ui/TextField';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), mode: 'onTouched' });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        setFormError(t('auth.login.invalid'));
      } else if (!applyServerErrors(error, setError)) {
        setFormError(t(errorKey(error)));
      }
    }
  });

  return (
    <Card className="sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('auth.login.title')}
      </h1>
      <p className="mt-2 text-muted">{t('auth.login.subtitle')}</p>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label={t('fields.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label={t('fields.password')}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          {t('auth.login.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.login.noAccount')}{' '}
        <Link
          to="/register"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t('auth.login.toRegister')}
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link
          to="/"
          className="font-semibold text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {t('auth.guest')}
        </Link>
      </p>
    </Card>
  );
}
