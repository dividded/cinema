import { dateOf, dayOfWeek, timeOf } from './dateTime';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthName = (month: string): string => MONTHS[Number(month) - 1] ?? month;

/** "2026-09" → "September 2026" (or "Sep 2026" when short). */
export function formatMonth(yearMonth: string, short = false): string {
  const [year = '', month = ''] = yearMonth.split('-');
  const name = monthName(month);
  return `${short ? name.slice(0, 3) : name} ${year}`;
}

/** "2026-09-03 19:00" → "Thu 3 Sep 2026 · 19:00" (the time is left out if missing). */
export function formatShortDate(dateTime: string): string {
  const date = dateOf(dateTime);
  const [year = '', month = '', day = ''] = date.split('-');
  const time = timeOf(dateTime);
  const weekday = WEEKDAYS[dayOfWeek(date)] ?? '';
  return `${weekday} ${Number(day)} ${monthName(month).slice(0, 3)} ${year}${time === '' ? '' : ` · ${time}`}`;
}
