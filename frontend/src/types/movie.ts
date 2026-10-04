import { z } from 'zod';

export const ScreeningSchema = z.object({
  dateTime: z.string(),
  venue: z.string(),
  language: z.string().optional(),
  subtitles: z.string().optional(),
});
export type Screening = z.infer<typeof ScreeningSchema>;

export const MovieSchema = z.object({
  title: z.string(),
  originalTitle: z.string().optional(),
  altName: z.string().optional(),
  year: z.number().optional(),
  durationMinutes: z.number().optional(),
  imgUrl: z.string().optional(),
  siteUrl: z.string().optional(),
  screenings: z.array(ScreeningSchema),
});
export type Movie = z.infer<typeof MovieSchema>;

/** Every movie plus the dates the API actually has data for (unfetched dates are absent). */
export const ScheduleSchema = z.object({
  updatedAt: z.string().nullable(),
  dates: z.array(z.string()),
  movies: z.array(MovieSchema),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

/** One month of past days, newest day first (same movie shape as the schedule). */
export const HistoryMonthSchema = z.object({
  month: z.string(),
  dates: z.array(z.string()),
  movies: z.array(MovieSchema),
});
export type HistoryMonth = z.infer<typeof HistoryMonthSchema>;

export const HistoryIndexSchema = z.object({
  months: z.array(z.object({ month: z.string(), days: z.number(), movies: z.number() })),
});
export type HistoryMonthSummary = z.infer<typeof HistoryIndexSchema>['months'][number];

/** Every movie the cinematheque has screened (or will), with all its screening times. */
export const ScreenedMovieSchema = z.object({
  title: z.string(),
  altName: z.string().optional(),
  year: z.number().optional(),
  siteUrl: z.string().optional(),
  /** "YYYY-MM-DD HH:MM", oldest first. */
  screenings: z.array(z.string()),
});
export type ScreenedMovie = z.infer<typeof ScreenedMovieSchema>;

export const ScreenedIndexSchema = z.object({ movies: z.array(ScreenedMovieSchema) });
