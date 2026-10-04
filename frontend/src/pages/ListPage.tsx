import styled from '@emotion/styled';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FaImdb } from 'react-icons/fa';
import { BrandTitle } from '../components/BrandTitle';
import { MainNav } from '../components/PageShell';
import { FilterToggle, SearchContainer, SearchInput } from '../components/styled/Controls';
import { LoadingMessage } from '../components/styled/Feedback';
import { Header, TitleBlock } from '../components/styled/Layout';
import { fetchScreened, ScreenedMovie, useLoaded } from '../hooks/useHistoryData';
import { filmAnchor, imdbUrl, LISTS, ListFilm, ListInfo, listPath } from '../lists/catalog';
import { filmTitles, movieMatchesFilm, movieTitleKeys, titleKey } from '../lists/match';
import { Link } from '../router';
import { getTodayInIsrael } from '../utils/dateTime';
import { formatShortDate } from '../utils/format';

const Page = styled.div`
  position: relative;
  z-index: 1;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 1.25rem 3rem;

  @media (max-width: 768px) {
    padding: 0 1rem 2.5rem;
  }
`;

const Intro = styled.section`
  margin: -0.5rem 0 1.5rem;

  h2 {
    font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(1.7rem, 5vw, 2.3rem);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.005em;
  }
  .subtitle {
    margin-top: 0.3rem;
    font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-size: 1.15rem;
    color: var(--ink-soft);
  }
  .description {
    margin-top: 0.75rem;
    max-width: 38rem;
    font-size: 0.9rem;
    color: var(--ink-soft);
  }
  .source {
    margin-top: 0.5rem;
    font-size: 0.78rem;
    color: var(--muted);
  }
`;

const OtherLists = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 1rem;
  align-items: center;
  font-size: 0.72rem;

  .label {
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-right: 0.2rem;
  }
  a {
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: rgba(26, 25, 22, 0.06);
    color: var(--ink-soft);
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }
  a:hover {
    background: rgba(26, 25, 22, 0.12);
    color: var(--ink);
  }
`;

const Toolbar = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0.6rem 0;
  margin-bottom: 0.25rem;
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);

  .count {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
`;

const Rows = styled.ol`
  list-style: none;
`;

const Row = styled.li<{ $screened: boolean; $flash: boolean }>`
  border-bottom: 1px solid rgba(20, 20, 20, 0.09);
  border-left: 2px solid ${(p) => (p.$screened ? 'var(--classic-line)' : 'transparent')};
  background: ${(p) => (p.$flash ? 'rgba(212, 175, 55, 0.16)' : 'transparent')};
  transition: background 1.2s ease;
  content-visibility: auto;
  contain-intrinsic-size: auto 58px;
  scroll-margin-top: 5rem;
`;

const RowButton = styled.button`
  appearance: none;
  width: 100%;
  display: grid;
  grid-template-columns: 2.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.25rem 0.65rem 0.5rem;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;

  &:hover {
    background: rgba(20, 20, 20, 0.02);
  }

  @media (max-width: 480px) {
    grid-template-columns: 2.1rem minmax(0, 1fr) auto;
    gap: 0.55rem;
  }
`;

const Rank = styled.span`
  font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1;
  text-align: right;
  font-variant-numeric: tabular-nums lining-nums;
  color: var(--ink-soft);
`;

const FilmText = styled.span`
  min-width: 0;

  .title {
    display: block;
    font-weight: 600;
    font-size: 0.98rem;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .meta {
    display: block;
    margin-top: 0.1rem;
    font-size: 0.76rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Side = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;

  .year {
    font-weight: 600;
    color: var(--ink-soft);
  }
  .screened {
    padding: 0.08rem 0.4rem;
    border-radius: 3px;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #4a3a05;
    background: rgba(212, 175, 55, 0.35);
    white-space: nowrap;
  }
  .chevron {
    width: 0.8rem;
    color: var(--muted);
    transition: transform 0.15s ease;
  }
  &[data-open] .chevron {
    transform: rotate(90deg);
  }

  @media (max-width: 480px) {
    .screened .word {
      display: none;
    }
  }
`;

const Details = styled.div`
  padding: 0 0.5rem 0.85rem 3.85rem;
  font-size: 0.82rem;
  color: var(--ink-soft);

  @media (max-width: 480px) {
    padding-left: 3.15rem;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    margin-bottom: 0.5rem;
  }
  .links a {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 600;
    font-size: 0.78rem;
  }
  .aka {
    color: var(--muted);
    font-size: 0.76rem;
    margin-bottom: 0.5rem;
  }
  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  li {
    font-variant-numeric: tabular-nums;
  }
  .upcoming {
    font-weight: 700;
    color: var(--weekend);
  }
`;

const Note = styled.p`
  color: var(--muted);
  font-family: 'Cormorant Garamond Variable', 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 1.15rem;
  text-align: center;
  padding: 1.5rem 0;
`;

interface Screened {
  movies: ScreenedMovie[];
  screenings: string[];
}

/** Which screened movies are each list film (by index into films). */
function matchScreenings(films: readonly ListFilm[], movies: readonly ScreenedMovie[]): Map<number, Screened> {
  const moviesByKey = new Map<string, ScreenedMovie[]>();
  for (const movie of movies) {
    for (const key of movieTitleKeys(movie)) {
      const list = moviesByKey.get(key) ?? [];
      list.push(movie);
      moviesByKey.set(key, list);
    }
  }
  const result = new Map<number, Screened>();
  films.forEach((film, i) => {
    const candidates = new Set(filmTitles(film).flatMap((title) => moviesByKey.get(titleKey(title)) ?? []));
    const matched = [...candidates].filter((movie) => movieMatchesFilm(movie, film));
    if (matched.length === 0) return;
    const screenings = [...new Set(matched.flatMap((m) => m.screenings))].sort();
    result.set(i, { movies: matched, screenings });
  });
  return result;
}

function filmSearchText(film: ListFilm): string {
  return [...filmTitles(film), film.director, film.year, film.country].filter(Boolean).join(' ').toLowerCase();
}

function FilmRow({
  film,
  screened,
  open,
  flash,
  onToggle,
  today,
}: {
  film: ListFilm;
  screened: Screened | undefined;
  open: boolean;
  flash: boolean;
  onToggle: () => void;
  today: string;
}) {
  const id = filmAnchor(film.rank, film.imdb);
  const count = screened?.screenings.length ?? 0;
  const aka = (film.aka ?? []).filter((t) => t !== film.title).slice(0, 3);
  return (
    <Row id={id} $screened={count > 0} $flash={flash}>
      <RowButton type="button" aria-expanded={open} aria-controls={`${id}-details`} onClick={onToggle}>
        <Rank>{film.rank}</Rank>
        <FilmText>
          <span className="title">{film.title}</span>
          <span className="meta">
            {film.director}
            {film.country ? ` · ${film.country}` : ''}
          </span>
        </FilmText>
        <Side data-open={open ? '' : undefined}>
          {count > 0 && (
            <span className="screened" title={`Screened ${count} times at the cinematheque`}>
              {count}× <span className="word">screened</span>
            </span>
          )}
          <span className="year">{film.year ?? '—'}</span>
          <svg className="chevron" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </Side>
      </RowButton>
      {open && (
        <Details id={`${id}-details`}>
          <div className="links">
            {film.imdb && (
              <a href={imdbUrl(film.imdb)} target="_blank" rel="noreferrer">
                <FaImdb aria-hidden="true" /> IMDb
              </a>
            )}
            {screened?.movies
              .filter((m) => m.siteUrl)
              .slice(0, 1)
              .map((m) => (
                <a key={m.title} href={m.siteUrl} target="_blank" rel="noreferrer">
                  Cinematheque page
                </a>
              ))}
          </div>
          {(aka.length > 0 || film.he) && (
            <div className="aka">
              Also:{' '}
              {[film.he, ...aka].filter(Boolean).map((title, i) => (
                <span key={title}>
                  {i > 0 && ' · '}
                  <bdi>{title}</bdi>
                </span>
              ))}
              {film.votes ? ` · ${film.votes} votes` : ''}
            </div>
          )}
          {screened ? (
            <>
              <div>
                Screened {count === 1 ? 'once' : `${count} times`} since we started keeping track
                {screened.movies.length === 1 && screened.movies[0].title !== film.title && (
                  <>
                    {' '}(as <bdi>{screened.movies[0].title}</bdi>)
                  </>
                )}
                :
              </div>
              <ul>
                {[...screened.screenings].reverse().map((dateTime) => (
                  <li key={dateTime} className={dateTime.slice(0, 10) >= today ? 'upcoming' : undefined}>
                    {formatShortDate(dateTime)}
                    {dateTime.slice(0, 10) >= today ? ' · upcoming' : ''}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div>Not screened at the cinematheque since we started keeping track.</div>
          )}
        </Details>
      )}
    </Row>
  );
}

export default function ListPage({ list }: { list: ListInfo }) {
  const [films, setFilms] = useState<ListFilm[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const { data: screenedMovies } = useLoaded(fetchScreened);
  const [query, setQuery] = useState('');
  const [onlyScreened, setOnlyScreened] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  const [flash, setFlash] = useState<number | null>(null);
  const deferredQuery = useDeferredValue(query);
  const today = getTodayInIsrael();

  useEffect(() => {
    list.load().then(setFilms, () => setLoadError(true));
  }, [list]);

  const screened = useMemo(
    () => (films && screenedMovies ? matchScreenings(films, screenedMovies) : new Map<number, Screened>()),
    [films, screenedMovies],
  );
  const searchText = useMemo(() => films?.map(filmSearchText) ?? [], [films]);

  const visible = useMemo(() => {
    if (!films) return [];
    const q = deferredQuery.trim().toLowerCase();
    return films
      .map((_, i) => i)
      .filter((i) => (!onlyScreened || screened.has(i)) && (!q || searchText[i].includes(q) || String(films[i].rank) === q));
  }, [films, deferredQuery, onlyScreened, screened, searchText]);

  // A badge links to #film-<imdb>: open that film and bring it into view.
  useEffect(() => {
    if (!films) return;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    const i = films.findIndex((film) => filmAnchor(film.rank, film.imdb) === hash);
    if (i < 0) return;
    setOpen(new Set([i]));
    setFlash(i);
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'center' }));
    const timer = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(timer);
  }, [films]);

  const toggle = (i: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const others = LISTS.filter((other) => other.id !== list.id);

  return (
    <>
      <Header>
        <TitleBlock>
          <BrandTitle />
          <MainNav />
        </TitleBlock>
      </Header>
      <Page>
        <Intro>
          <h2>{list.title}</h2>
          <p className="subtitle">{list.subtitle}</p>
          <p className="description">{list.description}</p>
          <p className="source">
            Source: <a href={list.source.url} target="_blank" rel="noreferrer">{list.source.label}</a>. Gold-edged
            films have screened at the cinematheque; open one to see when.
          </p>
          <OtherLists>
            <span className="label">Other lists</span>
            {others.map((other) => (
              <Link key={other.id} to={listPath(other.id)}>
                {other.shortName}
              </Link>
            ))}
          </OtherLists>
        </Intro>

        <Toolbar>
          <SearchContainer style={{ maxWidth: '16rem', flex: '1 1 10rem' }}>
            <SearchInput
              type="search"
              placeholder="Search title, director, year"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </SearchContainer>
          <FilterToggle type="button" $active={onlyScreened} aria-pressed={onlyScreened} onClick={() => setOnlyScreened((v) => !v)}>
            Screened here
          </FilterToggle>
          {films && (
            <span className="count">
              {visible.length === films.length ? `${films.length} films` : `${visible.length} of ${films.length}`}
              {screenedMovies ? ` · ${screened.size} screened` : ''}
            </span>
          )}
        </Toolbar>

        {loadError ? (
          <Note>Couldn’t load this list. Please try again later.</Note>
        ) : !films ? (
          <LoadingMessage compact />
        ) : visible.length === 0 ? (
          <Note>No films match.</Note>
        ) : (
          <Rows>
            {visible.map((i) => (
              <FilmRow
                key={i}
                film={films[i]}
                screened={screened.get(i)}
                open={open.has(i)}
                flash={flash === i}
                onToggle={() => toggle(i)}
                today={today}
              />
            ))}
          </Rows>
        )}
      </Page>
    </>
  );
}
