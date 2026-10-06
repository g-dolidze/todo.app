import type { AvatarIcon, UserDto } from '@progress/shared';
import { Icon, type IconName } from './Icon';

export const AVATAR_ICON_NAMES: Record<AvatarIcon, IconName> = {
  leaf: 'leaf',
  sun: 'sun',
  mountain: 'mountain',
  wave: 'wave',
  star: 'star',
  flame: 'flame',
  book: 'book',
  dumbbell: 'dumbbell',
};

const SIZES = { sm: 'size-11 text-sm', md: 'size-14 text-lg', lg: 'size-20 text-2xl' };
const ICON_SIZES = { sm: 20, md: 26, lg: 36 };

export function initials(user: Pick<UserDto, 'firstName' | 'lastName'>) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

interface AvatarProps {
  user: Pick<UserDto, 'firstName' | 'lastName' | 'avatar'> | null;
  size?: keyof typeof SIZES;
}

/** The user's chosen icon, their initials, or a neutral person icon for guests. */
export function Avatar({ user, size = 'sm' }: AvatarProps) {
  const base = `grid shrink-0 place-items-center rounded-full font-extrabold ${SIZES[size]}`;
  if (user?.avatar) {
    return (
      <span className={`${base} bg-primary-soft text-primary`} aria-hidden="true">
        <Icon name={AVATAR_ICON_NAMES[user.avatar]} size={ICON_SIZES[size]} />
      </span>
    );
  }
  return (
    <span className={`${base} bg-avatar text-on-avatar`} aria-hidden="true">
      {user ? initials(user) : <Icon name="profile" size={ICON_SIZES[size]} />}
    </span>
  );
}
