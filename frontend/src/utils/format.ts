const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "2026-09" → "September 2026" (or "Sep 2026" when short). */
export function formatMonth(month: string, short = false): string {
  const [year, m] = month.split('-').map(Number);
  const name = MONTHS[m - 1] ?? month;
  return `${short ? name.slice(0, 3) : name} ${year}`;
}

/** "2026-09-03 19:00" → "Thu 3 Sep 2026 · 19:00" (the time is left out if missing). */
export function formatShortDate(dateTime: string): string {
  const [date, time] = dateTime.split(' ');
  const [year, month, day] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  return `${weekday} ${day} ${MONTHS[month - 1].slice(0, 3)} ${year}${time ? ` · ${time}` : ''}`;
}
