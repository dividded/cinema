import { titleKey } from '../lists/match';
import { Movie, Screening } from '../types/movie';
import { compareTimeStrings, dateOf, dayOfWeek, isBeforeEvening, minutesOfDay, timeOf } from './dateTime';

export interface DayGroup {
  movies: Movie[];
  isWeekend: boolean;
  isMorningOnly: boolean;
}

export type MoviesByDate = Partial<Record<string, DayGroup>>;

export const isDateWeekend = (date: string): boolean => {
  const day = dayOfWeek(date);
  return day === 5 || day === 6;
};

export const isMorningOnlyMovie = (movie: Movie): boolean =>
  movie.screenings.length > 0 &&
  movie.screenings.every((screening) => minutesOfDay(timeOf(screening.dateTime)) < 17 * 60);

const earliestTime = (screenings: readonly Screening[]): string =>
  screenings.map((s) => timeOf(s.dateTime)).sort(compareTimeStrings)[0] ?? '';

/**
 * Which film a schedule entry is. The cinematheque lists one film under several titles
 * (a regular screening, a lecture, a festival slot: "הנסיכה מונונוקי | סינמטוקיו" and
 * "אפטר בסינמטק | הנסיכה מונונוקי"), but they share the English title and year.
 */
export const filmKey = (movie: Pick<Movie, 'title' | 'altName' | 'year'>): string =>
  movie.altName !== undefined && movie.altName !== ''
    ? `${titleKey(movie.altName)}|${String(movie.year ?? '')}`
    : `title|${movie.title}`;

export const groupMoviesByDate = (movies: readonly Movie[]): MoviesByDate => {
  const grouped: Record<string, DayGroup> = {};
  const byDateAndTitle = new Map<string, Movie>();

  for (const movie of movies) {
    for (const screening of movie.screenings) {
      const date = dateOf(screening.dateTime);
      const group = (grouped[date] ??= { movies: [], isWeekend: isDateWeekend(date), isMorningOnly: true });

      const key = `${date}|${movie.title}`;
      const existing = byDateAndTitle.get(key);
      if (existing) {
        existing.screenings.push(screening);
      } else {
        const entry = { ...movie, screenings: [screening] };
        byDateAndTitle.set(key, entry);
        group.movies.push(entry);
      }

      if (!isBeforeEvening(timeOf(screening.dateTime))) group.isMorningOnly = false;
    }
  }

  // Sort movies within each date by their earliest screening
  for (const group of Object.values(grouped)) {
    group.movies.sort((a, b) => compareTimeStrings(earliestTime(a.screenings), earliestTime(b.screenings)));
  }
  return grouped;
};

/** How many different dates each film screens on, by filmKey. */
export const getMovieDatesCount = (movies: readonly Movie[]): ReadonlyMap<string, number> => {
  const datesByFilm = new Map<string, Set<string>>();
  for (const movie of movies) {
    const key = filmKey(movie);
    const dates = datesByFilm.get(key) ?? new Set<string>();
    for (const screening of movie.screenings) dates.add(dateOf(screening.dateTime));
    datesByFilm.set(key, dates);
  }
  return new Map([...datesByFilm].map(([key, dates]) => [key, dates.size]));
};
