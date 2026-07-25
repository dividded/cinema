import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Movie } from './types/movie';
import { BackgroundLayer } from './components/BackgroundLayer';
import { BrandTitle } from './components/BrandTitle';
import { MovieSchedule } from './components/MovieSchedule';
import {
  Container,
  Header,
  HeaderControls,
} from './components/styled/Layout';
import {
  SearchContainer,
  SearchInput,
  FilterRow,
  FilterToggle,
} from './components/styled/Controls';
import {
  LoadingMessage,
  ErrorMessage
} from './components/styled/Feedback';
import { computeFilterResult } from './filters/computeFilterResult';
import { MOVIE_FILTERS } from './filters/registry';
import { MovieFilterState } from './filters/types';
import { useMovieIndex } from './hooks/useMovieIndex';
import { useRotatingBackground } from './hooks/useRotatingBackground';

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [enabledFilterIds, setEnabledFilterIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const movieIndex = useMovieIndex(movies);
  const backgroundUrl = useRotatingBackground();

  const filterState = useMemo<MovieFilterState>(
    () => ({
      searchQuery: deferredSearchQuery,
      enabledFilterIds,
    }),
    [deferredSearchQuery, enabledFilterIds],
  );

  const filterResult = useMemo(
    () => computeFilterResult(movieIndex.moviesByDate, filterState),
    [movieIndex.moviesByDate, filterState],
  );

  const fetchMovies = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL ||
        (import.meta.env.MODE === 'development'
          ? 'http://localhost:3000/api/movies/cinematheque'
          : 'https://cinema-api.cinematheque.workers.dev/api/movies/cinematheque');

      const response = await fetch(apiUrl, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      setMovies(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch movies');
      setLoading(false);
      console.error('Error fetching movies:', err);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const toggleFilter = (filterId: string) => {
    setEnabledFilterIds((current) => {
      const next = new Set(current);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  };

  if (loading) return <LoadingMessage />;
  if (error) return <ErrorMessage>Failed to load movies. Please try again later.</ErrorMessage>;

  return (
    <Container>
      <BackgroundLayer imageUrl={backgroundUrl} />
      <Header>
        <BrandTitle />
        <HeaderControls>
          <FilterRow>
            {MOVIE_FILTERS.map((filter) => {
              const active = enabledFilterIds.has(filter.id)
              return (
                <FilterToggle
                  key={filter.id}
                  type="button"
                  $active={active}
                  aria-pressed={active}
                  onClick={() => toggleFilter(filter.id)}
                >
                  {filter.label}
                </FilterToggle>
              )
            })}
          </FilterRow>
          <SearchContainer>
            <SearchInput
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </SearchContainer>
        </HeaderControls>
      </Header>
      <MovieSchedule index={movieIndex} filterResult={filterResult} />
    </Container>
  );
}

export default App;
