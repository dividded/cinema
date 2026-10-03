export const isBeforeEvening = (timeStr: string): boolean => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours < 17 || (hours === 17 && minutes <= 30);
};

export const compareTimeStrings = (a: string, b: string): number => {
  const [hoursA, minutesA] = a.split(':').map(Number);
  const [hoursB, minutesB] = b.split(':').map(Number);
  
  if (hoursA !== hoursB) {
    return hoursA - hoursB;
  }
  return minutesA - minutesB;
};

export const formatHebrewDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  const daysInHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  return `${dateStr} | יום ${daysInHebrew[dayOfWeek]}`;
}; 
/** Today's date in Israel as YYYY-MM-DD; the schedule follows local days. */
export const getTodayInIsrael = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
