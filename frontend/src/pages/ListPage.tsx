import styled from '@emotion/styled';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FaImdb } from 'react-icons/fa';
import { BrandTitle } from '../components/BrandTitle';
import { MainNav } from '../components/PageShell';
import { FilterToggle, SearchContainer, SearchInput } from '../components/styled/Controls';
import { LoadingMessage } from '../components/LoadingMessage';
import { NoMatches } from '../components/NoMatches';
import { Header, TitleBlock } from '../components/styled/Layout';
import { fetchScreened, useLoaded } from '../hooks/useHistoryData';
import { ScreenedMovie } from '../types/movie';
import { cutoffTie, filmAnchor, imdbUrl, listById, LISTS, ListFilm, ListInfo } from '../lists/catalog';
import { buildListIndex, filmTitles, matchMovie } from '../lists/match';
import { Link, useLocation, useParams } from '@tanstack/react-router';
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
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.85rem 1.25rem;
  padding: 0.25rem 0 0.9rem;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid var(--line);
`;

const Rows = styled.ol`
  list-style: none;
`;

const TieHeader = styled.h3`
  margin-top: 1.75rem;
  padding: 0 0.25rem 0.5rem 0.5rem;
  border-bottom: 1px solid var(--line-strong);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
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
  .soon {
    padding: 0.08rem 0.4rem;
    border-radius: 3px;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--weekend);
    background: rgba(90, 79, 120, 0.14);
    white-space: nowrap;
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
`;

const Details = styled.div`
  padding: 0 0.5rem 0.9rem 3.85rem;
  font-size: 0.82rem;
  color: var(--ink-soft);

  @media (max-width: 480px) {
    padding-left: 3.15rem;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    margin-bottom: 0.6rem;
  }
  .links a {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 600;
    font-size: 0.78rem;
  }
  dl {
    display: flex;
    flex-direction: column;
  }
  dt {
    margin-top: 0.45rem;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  dt:first-of-type {
    margin-top: 0;
  }
  dd {
    margin: 0.1rem 0 0;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  dd.hebrew {
    text-align: right;
    unicode-bidi: plaintext;
  }
  dd.upcoming {
    font-weight: 700;
    color: var(--weekend);
  }
  .none {
    color: var(--muted);
    font-style: italic;
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

/** Which screened movies are each list film (by index into films), with the badges' matching. */
function matchScreenings(list: ListInfo, films: readonly ListFilm[], movies: readonly ScreenedMovie[]): Map<number, Screened> {
  const index = buildListIndex([{ id: list.id, films }]);
  const position = new Map(films.map((film, i) => [film, i]));
  const result = new Map<number, Screened>();
  for (const movie of movies) {
    for (const hit of matchMovie(index, movie)) {
      const i = position.get(hit.film);
      if (i === undefined) continue;
      const entry = result.get(i) ?? { movies: [], screenings: [] };
      entry.movies.push(movie);
      entry.screenings = [...new Set([...entry.screenings, ...movie.screenings])].sort();
      result.set(i, entry);
    }
  }
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
  const past = screened?.screenings.filter((s) => s.slice(0, 10) < today) ?? [];
  const upcoming = screened?.screenings.filter((s) => s.slice(0, 10) >= today) ?? [];
  // The cinematheque's own (usually Hebrew) names for it, when they differ from the list's.
  const listedAs = [...new Set(screened?.movies.map((m) => m.title) ?? [])].filter((t) => t !== film.title);
  return (
    <Row id={id} $screened={Boolean(screened)} $flash={flash}>
      <RowButton type="button" aria-expanded={open} aria-controls={`${id}-details`} onClick={onToggle}>
        <Rank>{film.rank}</Rank>
        <FilmText>
          <span className="title">{film.title}</span>
          <span className="meta">
            {film.director}
            {film.country !== undefined && film.country !== '' ? ` · ${film.country}` : ''}
          </span>
        </FilmText>
        <Side data-open={open ? '' : undefined}>
          {upcoming.length > 0 && (
            <span className="soon">soon</span>
          )}
          {past.length > 0 && (
            <span className="screened">screened</span>
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
            {film.imdb !== undefined && (
              <a href={imdbUrl(film.imdb)} target="_blank" rel="noreferrer">
                <FaImdb aria-hidden="true" /> IMDb
              </a>
            )}
            {screened?.movies
              .flatMap((m) => (m.siteUrl !== undefined && m.siteUrl !== '' ? [m.siteUrl] : []))
              .slice(0, 1)
              .map((siteUrl) => (
                <a key={siteUrl} href={siteUrl} target="_blank" rel="noreferrer">
                  Cinematheque page
                </a>
              ))}
          </div>
          <dl>
            {film.original !== undefined && (
              <>
                <dt>Original title</dt>
                <dd dir="auto">{film.original}</dd>
              </>
            )}
            {listedAs.length > 0 && (
              <>
                <dt>At the cinematheque</dt>
                {listedAs.map((title) => (
                  <dd key={title} dir="rtl" className="hebrew">
                    {title}
                  </dd>
                ))}
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <dt>Upcoming</dt>
                {upcoming.map((dateTime) => (
                  <dd key={dateTime} className="upcoming">
                    {formatShortDate(dateTime)}
                  </dd>
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <dt>Screened</dt>
                {[...past].reverse().map((dateTime) => (
                  <dd key={dateTime}>{formatShortDate(dateTime)}</dd>
                ))}
              </>
            )}
          </dl>
          {!screened && <p className="none">Not shown at the cinematheque yet.</p>}
        </Details>
      )}
    </Row>
  );
}

export default function ListRoutePage() {
  const { listId } = useParams({ from: '/lists/$listId' });
  // Keyed so switching lists starts from a clean page (search, open films).
  return <ListPage key={listId} list={listById(listId)} />;
}

function ListPage({ list }: { list: ListInfo }) {
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
    list.load().then(setFilms, () => { setLoadError(true); });
  }, [list]);

  const screened = useMemo(
    () => (films && screenedMovies ? matchScreenings(list, films, screenedMovies) : new Map<number, Screened>()),
    [list, films, screenedMovies],
  );
  const entries = useMemo(
    () => films?.map((film, index) => ({ film, index, text: filmSearchText(film) })) ?? [],
    [films],
  );

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return entries.filter(
      ({ film, index, text }) =>
        (!onlyScreened || screened.has(index)) && (q === '' || text.includes(q) || String(film.rank) === q),
    );
  }, [entries, deferredQuery, onlyScreened, screened]);

  const tie = useMemo(() => (films ? cutoffTie(films, list.size) : null), [films, list.size]);
  const ranked = tie ? visible.filter(({ index }) => index < tie.start) : visible;
  const tied = tie ? visible.filter(({ index }) => index >= tie.start) : [];

  // A badge links to #film-<imdb>: open that film and bring it into view.
  const hash = useLocation({ select: (location) => location.hash });
  useEffect(() => {
    if (!films || hash === '') return;
    const i = films.findIndex((film) => filmAnchor(film.rank, film.imdb) === hash);
    if (i < 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      setOpen(new Set([i]));
      setFlash(i);
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'center' }));
      timer = setTimeout(() => {
        setFlash(null);
      }, 1600);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [films, hash, list.size]);

  const toggle = (i: number) => { setOpen((current) => {
      const next = new Set(current);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    }); };

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
          <p className="description">{list.description}</p>
          <p className="source">
            <a href={list.source.url} target="_blank" rel="noreferrer">{list.source.label}</a>
          </p>
          <OtherLists>
            <span className="label">Other lists</span>
            {others.map((other) => (
              <Link key={other.id} to="/lists/$listId" params={{ listId: other.id }}>
                {other.shortName}
              </Link>
            ))}
          </OtherLists>
        </Intro>

        <Toolbar>
          <SearchContainer style={{ maxWidth: '16rem', flex: '1 1 10rem' }}>
            <SearchInput
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              autoComplete="off"
              spellCheck={false}
            />
          </SearchContainer>
          <FilterToggle type="button" $active={onlyScreened} aria-pressed={onlyScreened} onClick={() => { setOnlyScreened((v) => !v); }}>
            Screening
          </FilterToggle>
        </Toolbar>

        {loadError ? (
          <Note>Couldn’t load this list.</Note>
        ) : !films ? (
          <LoadingMessage compact />
        ) : visible.length === 0 ? (
          <NoMatches
            query={deferredQuery}
            filters={onlyScreened ? ['Screening'] : []}
            onClear={() => {
              setQuery('');
              setOnlyScreened(false);
            }}
          />
        ) : (
          <>
            <Rows>
              {ranked.map(({ film, index }) => (
                <FilmRow
                  key={index}
                  film={film}
                  screened={screened.get(index)}
                  open={open.has(index)}
                  flash={flash === index}
                  onToggle={() => {
                    toggle(index);
                  }}
                  today={today}
                />
              ))}
            </Rows>
            {tie && tied.length > 0 && (
              <>
                <TieHeader>Also tied at #{tie.rank}</TieHeader>
                <Rows>
                  {tied.map(({ film, index }) => (
                    <FilmRow
                      key={index}
                      film={film}
                      screened={screened.get(index)}
                      open={open.has(index)}
                      flash={flash === index}
                      onToggle={() => {
                        toggle(index);
                      }}
                      today={today}
                    />
                  ))}
                </Rows>
              </>
            )}
          </>
        )}
      </Page>
    </>
  );
}
