/**
 * Calendar-day helpers. A "day" is always a local date string `YYYY-MM-DD` in the
 * user's time zone (TDD §6, §8.2). Arithmetic runs in UTC so DST can never shift a day.
 */

export type ISODate = string;

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function toUtcMs(date: ISODate): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`Invalid ISO date: ${date}`);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function fromUtcMs(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isISODate(value: string): value is ISODate {
  if (!ISO_DATE.test(value)) return false;
  return fromUtcMs(toUtcMs(value)) === value;
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / MS_PER_DAY);
}

export function isoWeekday(date: ISODate): Weekday {
  const day = new Date(toUtcMs(date)).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/** The user's current local date. Pass `now` explicitly so callers stay testable. */
export function todayInTimeZone(now: Date, timeZone: string): ISODate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const { year, month, day } = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${year}-${month}-${day}`;
}
