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

const DateSection = styled.div`
  margin-bottom: 2rem;
`

const DateHeader = styled.h3<{ isWeekend?: boolean; isMorningOnly?: boolean }>`
  color: ${props => {
    if (props.isWeekend) return '#ff9d00';
    if (props.isMorningOnly) return '#ff6b6b';
    return '#646cff';
  }};
  font-size: 1.2rem;
  margin: 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${props => {
    if (props.isWeekend) return '#ff9d00';
    if (props.isMorningOnly) return '#ff6b6b';
    return '#646cff';
  }};
`

const MovieCard = styled.div<{ isWeekend?: boolean; isMorningOnly?: boolean }>`
  background-color: ${props => {
    if (props.isWeekend) return '#1f1a15';
    if (props.isMorningOnly) return '#1f1515';
    return '#1a1a1a';
  }};
  border-radius: 6px;
  padding: 0.75rem;
  transition: transform 0.2s;
  border: 1px solid ${props => {
    if (props.isWeekend) return '#3d2e1a';
    if (props.isMorningOnly) return '#3d1a1a';
    return '#333';
  }};
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateX(-4px);
    border-color: ${props => {
      if (props.isWeekend) return '#ff9d00';
      if (props.isMorningOnly) return '#ff6b6b';
      return '#646cff';
    }};
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

const SearchContainer = styled.div`
  margin-top: 1rem;
`

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #1a1a1a;
  color: #fff;
  width: 100%;
  max-width: 300px;
`

interface MoviesByDate {
  [date: string]: {
    movies: Movie[];
    isWeekend: boolean;
    isMorningOnly: boolean;
  }
}

function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  // Helper function to check if time is before 17:30
  const isBeforeEvening = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours < 17 || (hours === 17 && minutes <= 30);
  };

  // Helper function to check if all screenings are before 17:30
  const isMorningOnlyMovie = (movie: Movie) => {
    return Array.from(movie.screenings).every(screening => {
      const time = screening.dateTime.split(' ')[1]; // Get time part
      return isBeforeEvening(time);
    });
  };

  // Group movies by date
  const groupMoviesByDate = (movies: Movie[]): MoviesByDate => {
    const grouped: MoviesByDate = {};
    
    movies.forEach(movie => {
      movie.screenings.forEach(screening => {
        const date = screening.dateTime.split(' ')[0];
        const [day, month, year] = date.split('-');
        const fullDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const dayOfWeek = fullDate.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

        if (!grouped[date]) {
          grouped[date] = {
            movies: [],
            isWeekend,
            isMorningOnly: true // Start true, will be set to false if any evening screening is found
          };
        }
        
        const existingMovie = grouped[date].movies.find(m => m.title === movie.title);
        if (existingMovie) {
          existingMovie.screenings.add(screening);
        } else {
          grouped[date].movies.push({
            ...movie,
            screenings: new Set([screening])
          });
        }

        // Update isMorningOnly for the date
        const time = screening.dateTime.split(' ')[1];
        if (!isBeforeEvening(time)) {
          grouped[date].isMorningOnly = false;
        }
      });
    });

    return grouped;
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const moviesByDate = groupMoviesByDate(filteredMovies);
  const sortedDates = Object.keys(moviesByDate).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('-').map(Number);
    const [dayB, monthB, yearB] = b.split('-').map(Number);
    return new Date(yearA, monthA - 1, dayA).getTime() - 
           new Date(yearB, monthB - 1, dayB).getTime();
  });

  // Format date to Hebrew
  const formatDateHebrew = (dateStr: string) => {
    const [day, month, year] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = date.getDay();
    
    const daysInHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    return `${dateStr} | יום ${daysInHebrew[dayOfWeek]}`;
  };

  if (loading) return <LoadingMessage>Loading movies...</LoadingMessage>
  if (error) return <ErrorMessage>{error}</ErrorMessage>

  return (
    <Container>
      <Header>
        <Title>Cinema Schedule</Title>
        <SearchContainer>
          <SearchInput 
            type="text"
            placeholder="חיפוש סרט..."
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
              {formatDateHebrew(date)}
            </DateHeader>
            {moviesByDate[date].movies.map((movie, index) => (
              <MovieCard 
                key={`${date}-${index}`}
                isWeekend={moviesByDate[date].isWeekend}
                isMorningOnly={!moviesByDate[date].isWeekend && isMorningOnlyMovie(movie)}
              >
                <MovieTitle>{movie.title}</MovieTitle>
                <ScreeningsList>
                  {Array.from(movie.screenings).map((screening, idx) => (
                    <ScreeningItem key={idx}>
                      <DateTime>{screening.dateTime.split(' ')[1]}</DateTime>
                      <Venue>{screening.venue}</Venue>
                    </ScreeningItem>
                  ))}
                </ScreeningsList>
              </MovieCard>
            ))}
          </DateSection>
        ))}
      </MovieList>
    </Container>
  )
}

export default App