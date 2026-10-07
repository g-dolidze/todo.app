import type { AvatarIcon, UserDto } from '@progress/shared';
import type { User } from '../../generated/prisma/client';

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar as AvatarIcon | null,
    timezone: user.timezone,
    locale: user.locale === 'EN' ? 'en' : 'ka',
    theme: user.theme,
    weekStart: user.weekStart === 7 ? 7 : 1,
    createdAt: user.createdAt.toISOString(),
  };
}
