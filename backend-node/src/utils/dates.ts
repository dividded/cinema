const ISRAEL_TIME_ZONE = 'Asia/Jerusalem';

/** Today's date in Israel as YYYY-MM-DD; the cinema's schedule follows local days. */
export function getTodayInIsrael(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISRAEL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** The next `count` dates (YYYY-MM-DD), starting with today in Israel. */
export function getUpcomingDates(count: number, now: Date = new Date()): string[] {
  const [year, month, day] = getTodayInIsrael(now).split('-').map(Number);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(year, month - 1, day + i)).toISOString().slice(0, 10),
  );
}
