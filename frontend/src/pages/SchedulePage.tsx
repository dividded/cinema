import { useDeferredValue, useMemo, useState } from 'react';
import { Movie } from '../types/movie';
import { BrandTitle } from '../components/BrandTitle';
import { MovieSchedule } from '../components/MovieSchedule';
import { MainNav } from '../components/PageShell';
import {
  Header,
  HeaderControls,
  TitleBlock,
} from '../components/styled/Layout';
import {
  SearchContainer,
  SearchInput,
  FilterRow,
  FilterToggle,
} from '../components/styled/Controls';
import {
  LoadingMessage,
  ErrorMessage
} from '../components/styled/Feedback';
import { computeFilterResult } from '../filters/computeFilterResult';
import { MOVIE_FILTERS } from '../filters/registry';
import { MovieFilterState } from '../filters/types';
import { useMovieIndex } from '../hooks/useMovieIndex';
import { useListHits } from '../hooks/useListHits';
import { useSchedule } from '../hooks/useSchedule';

const NO_MOVIES: Movie[] = [];
const NO_DATES: string[] = [];

export default function SchedulePage() {
  const { schedule, error } = useSchedule();
  const [searchQuery, setSearchQuery] = useState('');
  const [enabledFilterIds, setEnabledFilterIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const movieIndex = useMovieIndex(schedule?.movies ?? NO_MOVIES, schedule?.dates ?? NO_DATES);
  const listHits = useListHits(schedule?.movies ?? NO_MOVIES);

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

  if (error) return <ErrorMessage>Failed to load movies. Please try again later.</ErrorMessage>;

  return (
    <>
      <Header>
        <TitleBlock>
          <BrandTitle />
          <MainNav />
        </TitleBlock>
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
      {schedule ? (
        <MovieSchedule index={movieIndex} filterResult={filterResult} listHits={listHits} />
      ) : (
        <LoadingMessage compact />
      )}
    </>
  );
}
