import { useEffect, useState } from 'react'
import { Movie } from './types/movie'
import { MovieCard } from './components/MovieCard'
import { NoMoviesCard } from './components/NoMoviesCard'
import {
  Container,
  Header,
  Title,
  MovieList,
  DateSection
} from './components/styled/Layout'
import {
  SearchContainer,
  SearchInput,
  FilterLabel
} from './components/styled/Controls'
import { DateHeader } from './components/styled/DateHeader'
import {
  LoadingMessage,
  ErrorMessage
} from './components/styled/Feedback'
import { 
  groupMoviesByDate,
  isMorningOnlyMovie,
  getMovieDatesCount,
  getAllDatesInRange
} from './utils/movies'
import { formatHebrewDate } from './utils/dateTime'

function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showOldMoviesOnly, setShowOldMoviesOnly] = useState(false)

  const fetchMovies = async () => {
    try {
      // Use environment variable if set, otherwise:
      // - In development: use localhost
      // - In production: use the Vercel backend URL
      const apiUrl = import.meta.env.VITE_API_URL || 
        (import.meta.env.MODE === 'development' 
          ? 'http://localhost:3000/api/movies/cinematheque'
          : 'https://cinema-mu-ten.vercel.app/api/movies/cinematheque')
      
      // Always fetch from API - no caching
      const response = await fetch(apiUrl, {
        cache: 'no-store'
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      setMovies(data)
      setLoading(false)
      setError(null)
    } catch (err) {
      setError('Failed to fetch movies')
      setLoading(false)
      console.error('Error fetching movies:', err)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.altName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    if (!matchesSearch) return false;
    
    if (showOldMoviesOnly) {
      return movie.year ? movie.year < 2020 : false;
    }
    
    return true;
  });

  const moviesByDate = groupMoviesByDate(filteredMovies);
  const allMoviesByDate = groupMoviesByDate(movies);
  const allDatesArray = getAllDatesInRange();
  const movieDatesCount = getMovieDatesCount(movies);

  // Get today's date in Israeli timezone (Asia/Jerusalem)
  const getTodayInIsrael = (): string => {
    const now = new Date();
    // Format date in Israeli timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now); // Returns YYYY-MM-DD format
  };

  // Filter out dates that are older than today in Israeli time
  const todayInIsrael = getTodayInIsrael();
  const visibleDatesArray = allDatesArray.filter(date => date >= todayInIsrael);

  // Helper function to determine if a date is weekend
  const isDateWeekend = (date: string): boolean => {
    const [year, month, day] = date.split('-').map(Number);
    const fullDate = new Date(year, month - 1, day);
    const dayOfWeek = fullDate.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6;
  };

  if (loading) return <LoadingMessage />
  if (error) return <ErrorMessage>Failed to load movies. Please try again later.</ErrorMessage>

  return (
    <Container>
      <Header>
        <Title>Cinema</Title>
        <SearchContainer>
          <SearchInput 
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchContainer>
        <FilterLabel>
          <input
            type="checkbox"
            checked={showOldMoviesOnly}
            onChange={(e) => setShowOldMoviesOnly(e.target.checked)}
          />
          Movies older than 2020
        </FilterLabel>
      </Header>
      <MovieList>
        {visibleDatesArray.map(date => {
          const hasFilteredMovies = moviesByDate[date] && moviesByDate[date].movies.length > 0;
          const hasAnyMovies = allMoviesByDate[date] && allMoviesByDate[date].movies.length > 0;
          const isWeekend = isDateWeekend(date);
          
          // Don't show date section if movies exist but are filtered out
          if (!hasFilteredMovies && hasAnyMovies) {
            return null;
          }
          
          return (
            <DateSection key={date}>
              <DateHeader 
                isWeekend={isWeekend}
                isMorningOnly={hasFilteredMovies && !isWeekend && moviesByDate[date]?.isMorningOnly}
              >
                {formatHebrewDate(date)}
              </DateHeader>
              {hasFilteredMovies ? (
                moviesByDate[date].movies.map((movie) => (
                  <MovieCard
                    key={`${movie.title}-${movie.screenings[0]?.dateTime || 'unknown'}`}
                    movie={movie}
                    isWeekend={isWeekend}
                    isMorningOnly={!isWeekend && isMorningOnlyMovie(movie)}
                    movieDatesCount={movieDatesCount}
                  />
                ))
              ) : (
                <NoMoviesCard date={date} isWeekend={isWeekend} />
              )}
            </DateSection>
          );
        })}
      </MovieList>
    </Container>
  )
}

export default App