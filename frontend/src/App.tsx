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
  RefreshButton,
  SearchContainer,
  SearchInput
} from './components/styled/Controls'
import { DateHeader } from './components/styled/DateHeader'
import {
  LoadingMessage,
  ErrorMessage
} from './components/styled/Feedback'
import { 
  MoviesByDate,
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
  const [refreshing, setRefreshing] = useState(false)

  const fetchMovies = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/movies/cinematheque')
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

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('http://localhost:8080/api/movies/cinematheque/invalidate', {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMovies(data)
      setError(null)
    } catch (err) {
      setError('Failed to refresh movies')
      console.error('Error refreshing movies:', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (movie.altName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const moviesByDate = groupMoviesByDate(filteredMovies);
  const sortedDates = Object.keys(moviesByDate).sort((a, b) => a.localeCompare(b));
  const movieDatesCount = getMovieDatesCount(movies);

  if (loading) return <LoadingMessage>Loading movies...</LoadingMessage>
  if (error) return <ErrorMessage>Failed to load movies. Please try again later.</ErrorMessage>

  return (
    <Container>
      <Header>
        <Title>Cinema Schedule</Title>
        <RefreshButton onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Movies'}
        </RefreshButton>
        <SearchContainer>
          <SearchInput 
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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