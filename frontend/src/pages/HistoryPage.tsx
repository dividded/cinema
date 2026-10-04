import styled from '@emotion/styled';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { BrandTitle } from '../components/BrandTitle';
import { ListBadges } from '../components/ListBadges';
import { DateSectionBlock } from '../components/MovieSchedule';
import { MainNav } from '../components/PageShell';
import { SearchContainer, SearchInput } from '../components/styled/Controls';
import { LoadingMessage } from '../components/LoadingMessage';
import { Header, HeaderControls, MovieList, TitleBlock } from '../components/styled/Layout';
import {
  fetchHistoryIndex,
  fetchHistoryMonth,
  fetchScreened,
  useLoaded,
} from '../hooks/useHistoryData';
import { HistoryMonth } from '../types/movie';
import { useListHits } from '../hooks/useListHits';
import { isDateWeekend } from '../utils/movies';
import { getTodayInIsrael } from '../utils/dateTime';
import { groupMoviesByDate } from '../utils/movies';
import { formatMonth, formatShortDate } from '../utils/format';
import { titleKey } from '../lists/match';

// Past days are fetched one month at a time: the newest month first, then each older month
// as the reader scrolls near the end (or jumps to it from the month bar). Day sections use
// content-visibility, so even a long history only lays out what is on screen.

const MonthBar = styled.nav`
  position: sticky;
  top: 0;
  z-index: 5;
  max-width: 820px;
  margin: 0 auto 1.25rem;
  padding: 0.55rem 1.25rem;
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

const MonthChip = styled.button<{ $active: boolean }>`
  appearance: none;
  flex: 0 0 auto;
  border: none;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: ${(p) => (p.$active ? 'var(--bg-elevated)' : 'var(--ink-soft)')};
  background: ${(p) => (p.$active ? 'var(--ink)' : 'rgba(26, 25, 22, 0.06)')};
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${(p) => (p.$active ? 'var(--ink)' : 'rgba(26, 25, 22, 0.12)')};
  }
`;

const MonthHeading = styled.h2`
  font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
  font-size: 1.9rem;
  font-weight: 600;
  font-style: italic;
  line-height: 1.1;
  margin: 0 0 -0.75rem;
  scroll-margin-top: 4rem;

`;

const Note = styled.p`
  color: var(--muted);
  font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 1.15rem;
  text-align: center;
  padding: 1.5rem 0;
`;

const Sentinel = styled.div`
  height: 1px;
`;

const ResultList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
`;

const Result = styled.li`
  padding: 0.85rem 0.1rem 0.85rem 0.65rem;
  border-bottom: 1px solid rgba(20, 20, 20, 0.1);
  content-visibility: auto;
  contain-intrinsic-size: auto 90px;
`;

const ResultTitle = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 1.02rem;
  overflow-wrap: anywhere;

  .year {
    flex: 0 0 auto;
    font-size: 0.9rem;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }
  .alt {
    display: block;
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--muted);
  }
`;

const Dates = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.45rem;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;

  span {
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    background: rgba(26, 25, 22, 0.06);
    color: var(--ink-soft);
    white-space: nowrap;
  }
`;

function MonthSection({ data }: { data: HistoryMonth }) {
  const moviesByDate = useMemo(() => groupMoviesByDate(data.movies), [data.movies]);
  const listHits = useListHits(data.movies);
  return (
    <>
      <MonthHeading id={`month-${data.month}`}>
        {formatMonth(data.month)}
      </MonthHeading>
      {data.dates.map((date) => (
        <DateSectionBlock
          key={date}
          date={date}
          meta={undefined}
          movies={moviesByDate[date]?.movies}
          isWeekend={isDateWeekend(date)}
          movieDatesCount={NO_COUNTS}
          listHits={listHits}
        />
      ))}
    </>
  );
}

const NO_COUNTS: ReadonlyMap<string, number> = new Map();

function SearchResults({ query }: { query: string }) {
  const { data: screened, error } = useLoaded(fetchScreened);
  const today = getTodayInIsrael();
  const results = useMemo(() => {
    if (!screened) return [];
    const q = titleKey(query);
    const lower = query.trim().toLowerCase();
    return screened
      .map((movie) => ({ ...movie, past: movie.screenings.filter((s) => s.slice(0, 10) < today) }))
      .filter(
        (movie) =>
          movie.past.length > 0 &&
          (movie.title.toLowerCase().includes(lower) ||
            (movie.altName?.toLowerCase().includes(lower) ?? false) ||
            (q !== '' && titleKey(movie.altName ?? movie.title).includes(q))),
      )
      .sort((a, b) => (b.past.at(-1) ?? '').localeCompare(a.past.at(-1) ?? ''));
  }, [screened, query, today]);
  const listHits = useListHits(results);

  if (error) return <Note>Couldn’t load the history.</Note>;
  if (!screened) return <LoadingMessage compact />;
  if (results.length === 0) return <Note>No matches.</Note>;

  return (
    <ResultList>
      {results.map((movie) => (
        <Result key={movie.title}>
          <ResultTitle>
            <span>
              {movie.altName !== undefined && movie.altName !== '' && movie.altName !== movie.title ? (
                <>
                  {movie.altName}
                  <span className="alt">{movie.title}</span>
                </>
              ) : (
                movie.title
              )}
            </span>
            <span className="year">{movie.year ?? '—'}</span>
          </ResultTitle>
          <ListBadges hits={listHits[movie.title] ?? []} />
          <Dates aria-label={`Screened ${movie.past.length} times`}>
            {[...movie.past].reverse().map((dateTime) => (
              <span key={dateTime}>{formatShortDate(dateTime)}</span>
            ))}
          </Dates>
        </Result>
      ))}
    </ResultList>
  );
}

function scrollToMonth(month: string): void {
  // After the next render, in case the month list is only now replacing search results.
  requestAnimationFrame(() => {
    document.getElementById(`month-${month}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export default function HistoryPage() {
  const { data: months, error } = useLoaded(fetchHistoryIndex);
  const [wanted, setWanted] = useState(1);
  const [loaded, setLoaded] = useState<Record<string, HistoryMonth>>({});
  const [failed, setFailed] = useState(false);
  const pendingJump = useRef<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searching = deferredQuery.trim().length >= 2;

  // Load the wanted months in order, so they always render as an unbroken run.
  const nextToLoad = months?.slice(0, wanted).find((m) => !(m.month in loaded));
  useEffect(() => {
    if (!nextToLoad || failed) return;
    let cancelled = false;
    fetchHistoryMonth(nextToLoad.month).then(
      (data) => {
        if (!cancelled) setLoaded((current) => ({ ...current, [data.month]: data }));
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [nextToLoad, failed]);

  const shown = useMemo(
    () => (months ?? []).slice(0, wanted).flatMap((m) => loaded[m.month] ?? []),
    [months, wanted, loaded],
  );
  const busy = nextToLoad !== undefined;
  const hasMore = months !== null && wanted < months.length;

  // Infinite scroll: ask for the next older month when the end comes within ~1.5 screens.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || busy || !hasMore || searching) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setWanted((n) => n + 1);
      },
      { rootMargin: '0px 0px 150% 0px' },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [busy, hasMore, searching]);

  // A month picked in the bar scrolls into view once it (and everything newer) has loaded.
  useEffect(() => {
    const month = pendingJump.current;
    if (month === null || !(month in loaded) || busy) return;
    pendingJump.current = null;
    scrollToMonth(month);
  }, [loaded, busy]);

  // Highlight the month being read in the bar.
  useEffect(() => {
    if (searching) return;
    const headings = [...document.querySelectorAll<HTMLElement>('h2[id^="month-"]')];
    const onScroll = () => {
      let current: HTMLElement | undefined = headings[0];
      for (const heading of headings) if (heading.getBoundingClientRect().top < 120) current = heading;
      if (current) setActiveMonth(current.id.slice('month-'.length));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [shown, searching]);

  const jump = (month: string, i: number) => {
    setQuery('');
    if (month in loaded && !busy) {
      scrollToMonth(month);
    } else {
      pendingJump.current = month;
      setWanted((n) => Math.max(n, i + 1));
    }
  };

  return (
    <>
      <Header>
        <TitleBlock>
          <BrandTitle />
          <MainNav />
        </TitleBlock>
        <HeaderControls>
          <SearchContainer style={{ maxWidth: '14rem' }}>
            <SearchInput
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              autoComplete="off"
              spellCheck={false}
            />
          </SearchContainer>
        </HeaderControls>
      </Header>

      {months && months.length > 1 && !searching && (
        <MonthBar aria-label="Months">
          {months.map((m, i) => (
            <MonthChip key={m.month} type="button" $active={activeMonth === m.month} onClick={() => { jump(m.month, i); }}>
              {formatMonth(m.month, true)}
            </MonthChip>
          ))}
        </MonthBar>
      )}

      <MovieList>
        {searching ? (
          <SearchResults query={deferredQuery} />
        ) : error ? (
          <Note>Couldn’t load the history.</Note>
        ) : !months ? (
          <LoadingMessage compact />
        ) : months.length === 0 ? (
          <Note>Nothing here yet.</Note>
        ) : (
          <>
            {shown.map((data) => (
              <MonthSection key={data.month} data={data} />
            ))}
            {failed ? <Note>Couldn’t load more.</Note> : busy && <LoadingMessage compact />}
            <Sentinel ref={sentinelRef} />
          </>
        )}
      </MovieList>
    </>
  );
}
