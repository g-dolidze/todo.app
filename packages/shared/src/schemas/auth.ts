import { z } from 'zod';
import { isTimeZone, LOCALES, THEMES } from '../domain/preferences';

/*
 * API contract for accounts and profiles (TDD §10.2). Used by the API for validation and by
 * the web forms. Error messages are translation keys: the web app shows `validation.<message>`.
 */

export const AVATAR_ICONS = [
  'leaf',
  'sun',
  'mountain',
  'wave',
  'star',
  'flame',
  'book',
  'dumbbell',
] as const;
export type AvatarIcon = (typeof AVATAR_ICONS)[number];

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'email.invalid')
  .pipe(z.email('email.invalid'));

export const PasswordSchema = z
  .string()
  .min(8, 'password.tooShort')
  .max(128, 'password.tooLong')
  .regex(/\p{L}/u, 'password.letter')
  .regex(/\d/, 'password.digit');

const NameSchema = z.string().trim().min(1, 'name.required').max(50, 'name.tooLong');

const TimeZoneSchema = z.string().refine(isTimeZone, 'timezone.invalid');

export const RegisterSchema = z.strictObject({
  firstName: NameSchema,
  lastName: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  timezone: TimeZoneSchema,
  locale: z.enum(LOCALES),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.strictObject({
  email: EmailSchema,
  password: z.string().min(1, 'password.required').max(128, 'password.tooLong'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateMeSchema = z
  .strictObject({
    firstName: NameSchema,
    lastName: NameSchema,
    avatar: z.enum(AVATAR_ICONS).nullable(),
    timezone: TimeZoneSchema,
    locale: z.enum(LOCALES),
    theme: z.enum(THEMES),
    weekStart: z.union([z.literal(1), z.literal(7)]),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'update.empty');
export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;

export const ChangePasswordSchema = z
  .strictObject({
    currentPassword: z.string().min(1, 'password.required').max(128, 'password.tooLong'),
    newPassword: PasswordSchema,
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: 'password.same',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const DeleteMeSchema = z.strictObject({
  password: z.string().min(1, 'password.required').max(128, 'password.tooLong'),
});
export type DeleteMeInput = z.infer<typeof DeleteMeSchema>;

/** The user as the API returns it. Never contains the password hash. */
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: AvatarIcon | null;
  timezone: string;
  locale: (typeof LOCALES)[number];
  theme: (typeof THEMES)[number];
  weekStart: 1 | 7;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}
