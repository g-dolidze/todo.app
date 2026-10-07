import { zodResolver } from '@hookform/resolvers/zod';
import {
  AVATAR_ICONS,
  ChangePasswordSchema,
  DeleteMeSchema,
  ProfileDetailsSchema,
  type ChangePasswordInput,
  type DeleteMeInput,
  type ProfileDetailsInput,
  type UserDto,
} from '@progress/shared';
import { useMemo, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthProvider';
import { applyServerErrors, errorKey } from '../../auth/forms';
import { Avatar, AVATAR_ICON_NAMES } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormAlert } from '../../components/ui/FormAlert';
import { Segmented } from '../../components/ui/Segmented';
import { inputClass, PasswordField, TextField } from '../../components/ui/TextField';
import { useToast } from '../../components/ui/Toast';
import { formatFullDate } from '../../lib/dates';
import { CardTitle } from './CardTitle';

/*
 * The signed-in part of the profile page. A separate chunk: guests never download the
 * form and validation code (TDD §14.6 performance budget).
 */

function IdentityCard({ user }: { user: UserDto }) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const since = formatFullDate(new Date(user.createdAt), i18n.language === 'en' ? 'en' : 'ka');

  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar user={user} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-extrabold tracking-tight">
          {user.firstName} {user.lastName}
        </p>
        <p className="truncate text-muted">{user.email}</p>
        <p className="mt-1 text-sm text-muted">{t('profile.memberSince', { date: since })}</p>
      </div>
      <Button
        variant="secondary"
        loading={leaving}
        onClick={async () => {
          setLeaving(true);
          await logout();
          navigate('/', { replace: true });
        }}
      >
        <Icon name="logout" size={18} />
        {t('profile.logout')}
      </Button>
    </Card>
  );
}

function timeZones(current: string): string[] {
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    // Very old browser: only the current zone is offered.
  }
  return zones.includes(current) ? zones : [current, ...zones];
}

function DetailsCard({ user }: { user: UserDto }) {
  const { t } = useTranslation();
  const { updateMe } = useAuth();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const zones = useMemo(() => timeZones(user.timezone), [user.timezone]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<ProfileDetailsInput>({
    resolver: zodResolver(ProfileDetailsSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      timezone: user.timezone,
      weekStart: user.weekStart,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    // Send only what changed.
    const changed = Object.fromEntries(
      Object.entries(values).filter(([key]) => dirtyFields[key as keyof ProfileDetailsInput]),
    );
    try {
      const updated = await updateMe(changed);
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatar: updated.avatar,
        timezone: updated.timezone,
        weekStart: updated.weekStart,
      });
      toast(t('profile.saved'));
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(t(errorKey(error)));
    }
  });

  return (
    <Card aria-labelledby="details">
      <CardTitle id="details">{t('profile.details.title')}</CardTitle>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <Controller
          control={control}
          name="avatar"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">{t('profile.avatar.label')}</legend>
              <div className="flex flex-wrap gap-2">
                {[null, ...AVATAR_ICONS].map((icon) => {
                  const label = icon ? t(`profile.avatar.${icon}`) : t('profile.avatar.initials');
                  return (
                    <label
                      key={icon ?? 'initials'}
                      title={label}
                      className="cursor-pointer rounded-full p-0.5 ring-2 ring-transparent transition has-checked:ring-primary has-focus-visible:outline-3 has-focus-visible:outline-primary/45"
                    >
                      <input
                        type="radio"
                        name={field.name}
                        className="sr-only"
                        checked={field.value === icon}
                        onChange={() => field.onChange(icon)}
                        aria-label={label}
                      />
                      {icon ? (
                        <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary">
                          <Icon name={AVATAR_ICON_NAMES[icon]} size={20} />
                        </span>
                      ) : (
                        <Avatar user={{ ...user, avatar: null }} />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
        />

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
          value={user.email}
          readOnly
          disabled
          hint={t('profile.details.emailNote')}
        />

        <div>
          <label htmlFor="timezone" className="mb-1.5 block text-sm font-semibold">
            {t('fields.timezone')}
          </label>
          <select id="timezone" className={`${inputClass} border-line`} {...register('timezone')}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <Controller
          control={control}
          name="weekStart"
          render={({ field }) => (
            <Segmented
              legend={t('fields.weekStart')}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 1, label: t('fields.monday') },
                { value: 7, label: t('fields.sunday') },
              ]}
            />
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            {t('profile.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await changePassword(values);
      reset({ currentPassword: '', newPassword: '' });
      toast(t('profile.password.changed'));
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(t(errorKey(error)));
    }
  });

  return (
    <Card aria-labelledby="password">
      <CardTitle id="password">{t('profile.password.title')}</CardTitle>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <PasswordField
          label={t('fields.currentPassword')}
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordField
          label={t('fields.newPassword')}
          autoComplete="new-password"
          hint={t('auth.register.passwordHint')}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">{t('profile.password.note')}</p>
          <Button type="submit" variant="secondary" loading={isSubmitting} className="shrink-0">
            {t('profile.password.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DeleteAccountCard() {
  const { t } = useTranslation();
  const { deleteAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeleteMeInput>({ resolver: zodResolver(DeleteMeSchema) });

  const close = () => {
    setOpen(false);
    setFormError(null);
    reset({ password: '' });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await deleteAccount(values);
      toast(t('profile.danger.deleted'));
      navigate('/', { replace: true });
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(t(errorKey(error)));
    }
  });

  return (
    <Card aria-labelledby="danger" className="border-danger/30">
      <h2 id="danger" className="text-lg font-bold tracking-tight text-danger">
        {t('profile.danger.title')}
      </h2>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{t('profile.danger.text')}</p>
        <Button variant="danger" className="shrink-0" onClick={() => setOpen(true)}>
          <Icon name="trash" size={18} />
          {t('profile.danger.button')}
        </Button>
      </div>

      <Dialog
        open={open}
        onClose={close}
        title={t('profile.danger.confirmTitle')}
        description={t('profile.danger.confirmText')}
      >
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {formError && <FormAlert>{formError}</FormAlert>}
          <PasswordField
            label={t('fields.password')}
            autoComplete="current-password"
            autoFocus
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="danger" loading={isSubmitting}>
              {t('profile.danger.confirm')}
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}

export function SignedInProfile({ user, appearance }: { user: UserDto; appearance: ReactNode }) {
  return (
    <div className="space-y-5">
      <IdentityCard user={user} />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <DetailsCard key={user.id} user={user} />
        <div className="space-y-5">
          {appearance}
          <PasswordCard />
        </div>
      </div>
      <DeleteAccountCard />
    </div>
  );
}
