import { Movie } from '../types/movie';
import { isBeforeEvening, compareTimeStrings } from './dateTime';

export interface MoviesByDate {
  [date: string]: {
    movies: Movie[];
    isWeekend: boolean;
    isMorningOnly: boolean;
  }
}

export const isMorningOnlyMovie = (movie: Movie): boolean => {
  if (movie.screenings.length === 0) return false;
  
  return movie.screenings.every(screening => {
    const timeStr = screening.dateTime.split(' ')[1];
    const [hours] = timeStr.split(':').map(Number);
    return hours < 17;
  });
};

export const getEarliestScreeningTime = (screenings: Movie['screenings']): string => {
  return screenings
    .map(s => s.dateTime.split(' ')[1])
    .sort(compareTimeStrings)[0];
};

export const groupMoviesByDate = (movies: Movie[]): MoviesByDate => {
  const grouped: MoviesByDate = {};
  
  movies.forEach(movie => {
    movie.screenings.forEach(screening => {
      const date = screening.dateTime.split(' ')[0];
      const [year, month, day] = date.split('-').map(Number);
      const fullDate = new Date(year, month - 1, day);
      const dayOfWeek = fullDate.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      if (!grouped[date]) {
        grouped[date] = {
          movies: [],
          isWeekend,
          isMorningOnly: true
        };
      }
      
      const existingMovie = grouped[date].movies.find(m => m.title === movie.title);
      if (existingMovie) {
        existingMovie.screenings.push(screening);
      } else {
        grouped[date].movies.push({
          ...movie,
          screenings: [screening]
        });
      }

      const time = screening.dateTime.split(' ')[1];
      if (!isBeforeEvening(time)) {
        grouped[date].isMorningOnly = false;
      }
    });
  });

  // Sort movies within each date by their earliest screening
  Object.values(grouped).forEach(dateGroup => {
    dateGroup.movies.sort((a, b) => {
      const aTime = getEarliestScreeningTime(a.screenings);
      const bTime = getEarliestScreeningTime(b.screenings);
      return compareTimeStrings(aTime, bTime);
    });
  });

  return grouped;
};

export const getMovieDatesCount = (movies: Movie[]): { [title: string]: number } => {
  const datesByMovie: { [title: string]: Set<string> } = {};
  
  movies.forEach(movie => {
    if (!datesByMovie[movie.title]) {
      datesByMovie[movie.title] = new Set();
    }
    
    movie.screenings.forEach(screening => {
      const date = screening.dateTime.split(' ')[0];
      datesByMovie[movie.title].add(date);
    });
  });

  return Object.entries(datesByMovie).reduce((acc, [title, dates]) => {
    acc[title] = dates.size;
    return acc;
  }, {} as { [title: string]: number });
};

export const getAllDatesFromMovies = (movies: Movie[]): Set<string> => {
  const dates = new Set<string>();
  
  movies.forEach(movie => {
    movie.screenings.forEach(screening => {
      const date = screening.dateTime.split(' ')[0];
      dates.add(date);
    });
  });
  
  return dates;
};

/**
 * Gets all dates in the range from today for the next 60 days (matching backend range).
 * This ensures we show all dates even if they have no movies.
 */
export const getAllDatesInRange = (): string[] => {
  // Always use today as start date, matching backend behavior
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Reset to start of day
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 60); // 60 days ahead (matching backend NUMBER_OF_DAYS_TO_FETCH)
  
  const allDates: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    allDates.push(dateStr);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return allDates;
}; 