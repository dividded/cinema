import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Movie } from './types/movie'

const Container = styled.div`
  min-height: 100vh;
  background-color: #13151a;
  color: #fff;
  padding: 1rem;
`

const Header = styled.header`
  text-align: center;
  margin-bottom: 1.5rem;
`

const Title = styled.h1`
  color: #646cff;
  font-size: 2rem;
  margin: 0;
`

const MovieList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
`

const MovieCard = styled.div`
  background-color: #1a1a1a;
  border-radius: 6px;
  padding: 0.75rem;
  transition: transform 0.2s;
  border: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateX(-4px);
    border-color: #646cff;
  }
`

const MovieTitle = styled.h2`
  color: #646cff;
  margin: 0;
  font-size: 1rem;
  min-width: 200px;
  max-width: 300px;
  text-align: right;
  order: 2;
`

const ScreeningsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-start;
  order: 1;
  margin-right: 2rem;
`

const ScreeningItem = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  direction: ltr;
`

const DateTime = styled.span`
  color: #646cff;
`

const Venue = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #646cff;
  font-size: 1.2rem;
`

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ff6b6b;
  font-size: 1.2rem;
`

function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8080/api/movies')
      .then(response => response.json())
      .then(data => {
        const sortedMovies = data.sort((a: Movie, b: Movie) => {
          const aDate = getEarliestScreeningDate(a)
          const bDate = getEarliestScreeningDate(b)
          return aDate.getTime() - bDate.getTime()
        })
        setMovies(sortedMovies)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to fetch movies')
        setLoading(false)
        console.error('Error fetching movies:', err)
      })
  }, [])

  const getEarliestScreeningDate = (movie: Movie): Date => {
    if (!movie.screenings.length) return new Date(8640000000000000)
    
    return movie.screenings.reduce((earliest, screening) => {
      const screeningDate = new Date(screening.dateTime)
      return screeningDate < earliest ? screeningDate : earliest
    }, new Date(movie.screenings[0].dateTime))
  }

  if (loading) return <LoadingMessage>Loading movies...</LoadingMessage>
  if (error) return <ErrorMessage>{error}</ErrorMessage>

  return (
    <Container>
      <Header>
        <Title>Cinema Schedule</Title>
      </Header>
      <MovieList>
        {movies.map((movie, index) => (
          <MovieCard key={index}>
            <MovieTitle>{movie.title}</MovieTitle>
            <ScreeningsList>
              {movie.screenings.map((screening, idx) => (
                <ScreeningItem key={idx}>
                  <DateTime>{screening.dateTime}</DateTime>
                  <Venue>{screening.venue}</Venue>
                </ScreeningItem>
              ))}
            </ScreeningsList>
          </MovieCard>
        ))}
      </MovieList>
    </Container>
  )
}

export default App