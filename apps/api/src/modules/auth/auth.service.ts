import type { AuthResponse, LoginInput, RegisterInput } from '@progress/shared';
import { Prisma } from '../../generated/prisma/client';
import { AppError } from '../../lib/errors';
import { hashPassword, verifyPassword } from '../../lib/password';
import type { Db } from '../../lib/prisma';
import {
  createRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
} from '../../lib/tokens';
import { toUserDto } from '../users/user.dto';

export interface Session extends AuthResponse {
  refreshToken: string;
}

const invalidCredentials = () => new AppError('UNAUTHORIZED', 'Invalid email or password');
const invalidSession = () => new AppError('UNAUTHORIZED', 'Session expired, please sign in again');

export class AuthService {
  constructor(
    private readonly db: Db,
    private readonly jwtSecret: string,
  ) {}

  async register(input: RegisterInput): Promise<Session> {
    try {
      const user = await this.db.user.create({
        data: {
          email: input.email,
          passwordHash: await hashPassword(input.password),
          firstName: input.firstName,
          lastName: input.lastName,
          timezone: input.timezone,
          locale: input.locale === 'en' ? 'EN' : 'KA',
          ...(input.theme ? { theme: input.theme } : {}),
        },
      });
      return this.startSession(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('EMAIL_TAKEN', 'This email is already registered');
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<Session> {
    const user = await this.db.user.findUnique({ where: { email: input.email } });
    const valid = await verifyPassword(user?.passwordHash ?? null, input.password);
    if (!user || !valid) throw invalidCredentials();
    return this.startSession(user);
  }

  /**
   * Rotates the refresh token. Presenting an already-rotated (revoked) token means it was
   * stolen or replayed, so every session of that user is revoked (TDD §13).
   */
  async refresh(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken) throw invalidSession();
    const stored = await this.db.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      include: { user: true },
    });
    if (!stored) throw invalidSession();

    if (stored.revokedAt) {
      await this.revokeAll(stored.userId);
      throw invalidSession();
    }
    if (stored.expiresAt <= new Date()) throw invalidSession();

    // Revoke only if still active, so two parallel refreshes cannot both succeed.
    const { count } = await this.db.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) {
      await this.revokeAll(stored.userId);
      throw invalidSession();
    }
    return this.startSession(stored.user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.db.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string, exceptRefreshToken?: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptRefreshToken ? { NOT: { tokenHash: hashRefreshToken(exceptRefreshToken) } } : {}),
      },
      data: { revokedAt: new Date() },
    });
  }

  private async startSession(user: Parameters<typeof toUserDto>[0]): Promise<Session> {
    const { token, tokenHash } = createRefreshToken();
    await this.db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });
    return {
      accessToken: await signAccessToken(user.id, this.jwtSecret),
      refreshToken: token,
      user: toUserDto(user),
    };
  }
}
