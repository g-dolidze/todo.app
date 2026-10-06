import { describe, expect, it } from 'vitest';
import {
  ChangePasswordSchema,
  LoginSchema,
  PasswordSchema,
  RegisterSchema,
  UpdateMeSchema,
} from './auth';

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('PasswordSchema (TDD US-1)', () => {
  it('accepts 8+ characters with a letter and a digit, including Georgian letters', () => {
    expect(PasswordSchema.safeParse('abcdefg1').success).toBe(true);
    expect(PasswordSchema.safeParse('პაროლი12').success).toBe(true);
  });

  it('explains what is missing', () => {
    expect(firstMessage(PasswordSchema.safeParse('abc1'))).toBe('password.tooShort');
    expect(firstMessage(PasswordSchema.safeParse('12345678'))).toBe('password.letter');
    expect(firstMessage(PasswordSchema.safeParse('abcdefgh'))).toBe('password.digit');
    expect(firstMessage(PasswordSchema.safeParse('a1'.repeat(65)))).toBe('password.tooLong');
  });
});

describe('RegisterSchema', () => {
  const valid = {
    firstName: ' Giorgi ',
    lastName: 'Dolidze',
    email: '  Giorgi@Example.COM ',
    password: 'secret123',
    timezone: 'Asia/Tbilisi',
    locale: 'ka',
  };

  it('trims names and normalises email to lowercase', () => {
    const parsed = RegisterSchema.parse(valid);
    expect(parsed.firstName).toBe('Giorgi');
    expect(parsed.email).toBe('giorgi@example.com');
  });

  it('accepts any email domain, not only Gmail (v0.1 limit removed)', () => {
    expect(RegisterSchema.safeParse({ ...valid, email: 'me@company.ge' }).success).toBe(true);
  });

  it('rejects invalid email, empty names and unknown time zones', () => {
    expect(firstMessage(RegisterSchema.safeParse({ ...valid, email: 'nope' }))).toBe(
      'email.invalid',
    );
    expect(firstMessage(RegisterSchema.safeParse({ ...valid, firstName: '  ' }))).toBe(
      'name.required',
    );
    expect(firstMessage(RegisterSchema.safeParse({ ...valid, timezone: 'Mars/Base' }))).toBe(
      'timezone.invalid',
    );
  });

  it('asks for an email when it is empty', () => {
    expect(firstMessage(RegisterSchema.safeParse({ ...valid, email: '   ' }))).toBe(
      'email.required',
    );
  });

  it('rejects unknown fields', () => {
    expect(RegisterSchema.safeParse({ ...valid, isAdmin: true }).success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('only requires a non-empty password (strength is checked at sign-up)', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.ge', password: 'x' }).success).toBe(true);
    expect(firstMessage(LoginSchema.safeParse({ email: 'a@b.ge', password: '' }))).toBe(
      'password.required',
    );
  });
});

describe('UpdateMeSchema', () => {
  it('accepts a partial update', () => {
    expect(UpdateMeSchema.parse({ theme: 'DARK' })).toEqual({ theme: 'DARK' });
    expect(UpdateMeSchema.parse({ avatar: null })).toEqual({ avatar: null });
  });

  it('rejects an empty update, bad week start and unknown avatar', () => {
    expect(UpdateMeSchema.safeParse({}).success).toBe(false);
    expect(UpdateMeSchema.safeParse({ weekStart: 3 }).success).toBe(false);
    expect(UpdateMeSchema.safeParse({ avatar: 'javascript:alert(1)' }).success).toBe(false);
  });

  it('does not allow changing email or password here', () => {
    expect(UpdateMeSchema.safeParse({ email: 'x@y.ge' }).success).toBe(false);
  });
});

describe('ChangePasswordSchema', () => {
  it('requires a strong new password that differs from the current one', () => {
    expect(
      ChangePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'newpass12' }).success,
    ).toBe(true);
    expect(
      firstMessage(
        ChangePasswordSchema.safeParse({ currentPassword: 'samepass1', newPassword: 'samepass1' }),
      ),
    ).toBe('password.same');
  });
});
