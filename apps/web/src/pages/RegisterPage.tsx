import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterInput } from '@progress/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { applyServerErrors, errorKey } from '../auth/forms';
import { Card } from '../components/Card';
import { Button } from '../components/ui/Button';
import { FormAlert } from '../components/ui/FormAlert';
import { PasswordField, TextField } from '../components/ui/TextField';
import { useTheme } from '../theme/ThemeProvider';

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tbilisi';
  } catch {
    return 'Asia/Tbilisi';
  }
}

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { register: createAccount } = useAuth();
  const { preference } = useTheme();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onTouched',
    // Not shown in the form: detected from the browser and the current settings.
    defaultValues: {
      timezone: browserTimeZone(),
      locale: i18n.language === 'en' ? 'en' : 'ka',
      theme: preference,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // Use the language and theme chosen right before submitting.
      await createAccount({
        ...values,
        locale: i18n.language === 'en' ? 'en' : 'ka',
        theme: preference,
      });
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_TAKEN') {
        setError('email', { message: 'emailTaken' });
      } else if (!applyServerErrors(error, setError)) {
        setFormError(t(errorKey(error)));
      }
    }
  });

  return (
    <Card className="sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t('auth.register.title')}
      </h1>
      <p className="mt-2 text-muted">{t('auth.register.subtitle')}</p>

      <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label={t('fields.firstName')}
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <TextField
            label={t('fields.lastName')}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
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
          autoComplete="new-password"
          hint={t('auth.register.passwordHint')}
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>
          {t('auth.register.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t('auth.register.toLogin')}
        </Link>
      </p>
    </Card>
  );
}
