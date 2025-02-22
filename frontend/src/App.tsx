import { useEffect, useState } from 'react'
import { Movie } from './types/movie'
import { MovieCard } from './components/MovieCard'
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
  getMovieDatesCount
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
      // Get the current host's IP/hostname from the window location
      const baseUrl = window.location.hostname
      const response = await fetch(`http://${baseUrl}:8080/api/movies/cinematheque`)
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
  const sortedDates = Object.keys(moviesByDate).sort((a, b) => a.localeCompare(b));
  const movieDatesCount = getMovieDatesCount(movies);

  if (loading) return <LoadingMessage />
  if (error) return <ErrorMessage>Failed to load movies. Please try again later.</ErrorMessage>

  return (
    <Container>
      <Header>
        <Title>Cinema Schedule</Title>
        <SearchContainer>
          <SearchInput 
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FilterLabel>
            <input
              type="checkbox"
              checked={showOldMoviesOnly}
              onChange={(e) => setShowOldMoviesOnly(e.target.checked)}
            />
            Old Movies
          </FilterLabel>
        </SearchContainer>
      </Header>
      <MovieList>
        {sortedDates.map(date => (
          <DateSection key={date}>
            <DateHeader 
              isWeekend={moviesByDate[date].isWeekend}
              isMorningOnly={!moviesByDate[date].isWeekend && moviesByDate[date].isMorningOnly}
            >
              {formatHebrewDate(date)}
            </DateHeader>
            {moviesByDate[date].movies.map((movie) => (
              <MovieCard
                key={`${movie.title}-${movie.screenings[0]?.dateTime || 'unknown'}`}
                movie={movie}
                isWeekend={moviesByDate[date].isWeekend}
                isMorningOnly={!moviesByDate[date].isWeekend && isMorningOnlyMovie(movie)}
                movieDatesCount={movieDatesCount}
              />
            ))}
          </DateSection>
        ))}
      </MovieList>
    </Container>
  )
}

export default App