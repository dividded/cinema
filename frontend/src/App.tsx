import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Movie, Screening } from './types/movie'

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(160deg, #13151a 0%, #1a1d23 100%);
  color: #fff;
  padding: 1rem;
`

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1rem;
  background: linear-gradient(180deg, rgba(19,21,26,0) 0%, rgba(19,21,26,1) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const Title = styled.h1`
  color: #646cff;
  font-size: 2.5rem;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
  letter-spacing: -0.5px;
  text-shadow: 0 0 20px rgba(100, 108, 255, 0.3);
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

// Add interfaces for the styled component props
interface DateHeaderProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
}

interface MovieCardProps {
  isWeekend?: boolean;
  isMorningOnly?: boolean;
}

// Update the styled components with proper typing
const DateHeader = styled.h3<DateHeaderProps>`
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

const MovieCard = styled.div<MovieCardProps>`
  background-color: ${props => props.isWeekend ? '#1f1a15' : props.isMorningOnly ? '#1f1515' : '#1a1a1a'};
  border-radius: 6px;
  padding: 0.75rem;
  transition: transform 0.2s;
  border: 1px solid ${props => props.isWeekend ? '#3d2e1a' : props.isMorningOnly ? '#3d1a1a' : '#333'};
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateX(-4px);
    border-color: ${props => props.isWeekend ? '#ff9d00' : props.isMorningOnly ? '#ff6b6b' : '#646cff'};
  }
`

const MovieTitle = styled.h2`
  color: #646cff;
  margin: 0;
  font-size: 1rem;
  width: fit-content;
  max-width: 300px;
  text-align: right;
  direction: rtl;
`

const MovieTitleText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ScreeningsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
  justify-content: flex-start;
  align-items: center;
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
  margin: 0 auto;
  max-width: 600px;
  width: 100%;
  position: relative;

  &::after {
    content: '🔍';
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
  }
`

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s;
  backdrop-filter: blur(10px);

  &:focus {
    outline: none;
    border-color: #646cff;
    box-shadow: 0 0 0 4px rgba(100, 108, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const MultiDateIndicator = styled.span`
  background-color: rgba(255, 255, 255, 0.1);
  color: #646cff;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(100, 108, 255, 0.3);
  direction: ltr;
  white-space: nowrap;
  margin-right: 1rem;
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
    
    return Array.from(movie.screenings).reduce((earliest, screening) => {
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

  // Helper function to get earliest screening time
  const getEarliestScreeningTime = (screenings: Screening[]): string => {
    return screenings
      .map(s => s.dateTime.split(' ')[1])
      .sort(compareTimeStrings)[0];
  };

  // Helper function to compare time strings (HH:mm format)
  const compareTimeStrings = (a: string, b: string): number => {
    const [hoursA, minutesA] = a.split(':').map(Number);
    const [hoursB, minutesB] = b.split(':').map(Number);
    
    if (hoursA !== hoursB) {
      return hoursA - hoursB;
    }
    return minutesA - minutesB;
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
  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = date.getDay();
    
    const daysInHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    return `${dateStr} | יום ${daysInHebrew[dayOfWeek]}`;
  };

  // Add this function before the groupMoviesByDate function
  const getMovieDatesCount = (movies: Movie[]): { [title: string]: number } => {
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

  // In your App component, before the return statement:
  const movieDatesCount = getMovieDatesCount(movies);

  if (loading) return <LoadingMessage>Loading movies...</LoadingMessage>
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
        </SearchContainer>
      </Header>
      <MovieList>
        {sortedDates.map(date => (
          <DateSection key={date}>
            <DateHeader 
              isWeekend={moviesByDate[date].isWeekend}
              isMorningOnly={!moviesByDate[date].isWeekend && moviesByDate[date].isMorningOnly}
            >
              {formatDate(date)}
            </DateHeader>
            {moviesByDate[date].movies.map((movie, index) => (
              <MovieCard 
                key={`${date}-${index}`}
                isWeekend={moviesByDate[date].isWeekend}
                isMorningOnly={!moviesByDate[date].isWeekend && isMorningOnlyMovie(movie)}
              >
                <MovieTitle>
                  <MovieTitleText>{movie.title}</MovieTitleText>
                </MovieTitle>
                <ScreeningsList>
                  {movieDatesCount[movie.title] > 1 && (
                    <MultiDateIndicator>
                      Showing on {movieDatesCount[movie.title]} dates
                    </MultiDateIndicator>
                  )}
                  {movie.screenings.map((screening, index) => (
                    <ScreeningItem key={`${date}-${index}`}>
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