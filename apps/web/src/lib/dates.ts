import type { Locale, Weekday } from '@progress/shared';

/*
 * Many browsers (some Chromium builds, Android WebView) ship without Georgian locale data,
 * so `Intl.DateTimeFormat('ka-GE')` silently falls back to English. Georgian names are
 * therefore built in; English uses Intl.
 */

const KA_MONTHS = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
];

// Index 0 = Monday (ISO weekday 1).
const KA_WEEKDAYS = [
  'ორშაბათი',
  'სამშაბათი',
  'ოთხშაბათი',
  'ხუთშაბათი',
  'პარასკევი',
  'შაბათი',
  'კვირა',
];
const KA_WEEKDAYS_SHORT = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];

// 2024-01-01 was a Monday; used to get English names from Intl.
const enDate = (isoWeekday: number) => new Date(2024, 0, isoWeekday, 12);

export function monthName(monthIndex: number, locale: Locale): string {
  if (locale === 'ka') return KA_MONTHS[monthIndex]!;
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2024, monthIndex, 1));
}

export function weekdayName(
  weekday: Weekday,
  locale: Locale,
  width: 'long' | 'short' = 'long',
): string {
  if (locale === 'ka') return (width === 'long' ? KA_WEEKDAYS : KA_WEEKDAYS_SHORT)[weekday - 1]!;
  return new Intl.DateTimeFormat('en-US', { weekday: width }).format(enDate(weekday));
}

/** "სამშაბათი, 6 ოქტომბერი" / "Tuesday, October 6" */
export function formatLongDate(date: Date, locale: Locale): string {
  const weekday = (date.getDay() === 0 ? 7 : date.getDay()) as Weekday;
  const day = date.getDate();
  const month = monthName(date.getMonth(), locale);
  const name = weekdayName(weekday, locale);
  return locale === 'ka' ? `${name}, ${day} ${month}` : `${name}, ${month} ${day}`;
}
