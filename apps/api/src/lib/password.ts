import { hash, verify } from '@node-rs/argon2';

// argon2id with the library defaults (m=19 MiB, t=2, p=1) — the OWASP-recommended baseline.
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

// Used when the email is unknown, so a failed login takes the same time either way
// and response timing does not reveal which emails have accounts.
const DUMMY_HASH = hash('timing-equaliser-password');

export async function verifyPassword(
  passwordHash: string | null,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash ?? (await DUMMY_HASH), password);
  } catch {
    return false;
  }
}
