/** Minutes since midnight for "HH:MM" (0 if it can't be read). */
export const minutesOfDay = (time: string): number => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
};

/** The time part of "YYYY-MM-DD HH:MM". */
export const timeOf = (dateTime: string): string => dateTime.split(' ')[1] ?? '';

/** The date part of "YYYY-MM-DD HH:MM". */
export const dateOf = (dateTime: string): string => dateTime.slice(0, 10);

export const isBeforeEvening = (time: string): boolean => minutesOfDay(time) <= 17 * 60 + 30;

export const compareTimeStrings = (a: string, b: string): number => minutesOfDay(a) - minutesOfDay(b);

/** Day of the week (0 = Sunday) of a "YYYY-MM-DD" date. */
export const dayOfWeek = (date: string): number => new Date(`${date}T12:00:00Z`).getUTCDay();

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const formatHebrewDate = (date: string): string => `${date} | יום ${HEBREW_DAYS[dayOfWeek(date)] ?? ''}`;

/** Today's date in Israel as YYYY-MM-DD; the schedule follows local days. */
export const getTodayInIsrael = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
