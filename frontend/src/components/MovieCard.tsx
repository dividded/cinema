import { memo } from 'react';
import { Movie } from '../types/movie';
import {
  MovieCard as StyledMovieCard,
  MovieTitleContainer,
  MovieTitleText,
  OriginalTitle,
  MovieYear,
  MovieDuration,
  MovieMetadata,
  LinkButton,
  MetaSpacer,
} from './styled/MovieCard';
import {
  ScreeningsList,
  ScreeningItem,
  DateTime,
  Venue,
  MultiDateIndicator,
} from './styled/Screening';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { ListHit } from '../lists/match';
import { ListBadges } from './ListBadges';
import { filmKey } from '../utils/movies';
import { timeOf } from '../utils/dateTime';

interface MovieCardProps {
  movieKey: string;
  movie: Movie;
  isWeekend: boolean;
  isMorningOnly: boolean;
  movieDatesCount: ReadonlyMap<string, number>;
  listHits?: readonly ListHit[];
}

function MovieTitle({
  movie,
  isOldMovie,
}: {
  movie: Movie;
  isOldMovie: boolean;
}) {
  return (
    <MovieTitleText isOldMovie={isOldMovie}>
      {movie.altName !== undefined && movie.altName !== '' && movie.title !== movie.altName ? (
        <>
          {movie.altName}
          <OriginalTitle isOldMovie={isOldMovie}>{movie.title}</OriginalTitle>
        </>
      ) : (
        movie.title
      )}
    </MovieTitleText>
  );
}

function Screenings({
  movie,
  datesCount,
  idPrefix,
}: {
  movie: Movie;
  datesCount: number;
  idPrefix: string;
}) {
  return (
    <ScreeningsList>
      {datesCount > 1 && (
        <MultiDateIndicator>{datesCount} dates</MultiDateIndicator>
      )}
      {movie.screenings.slice(0, 2).map((screening, index) => (
        <ScreeningItem key={`${idPrefix}-${index}`}>
          <DateTime>{timeOf(screening.dateTime)}</DateTime>
          <Venue>{screening.venue === 'Cinematheque TLV' ? 'TLV' : screening.venue}</Venue>
          {screening.language !== undefined && screening.language !== '' && <Venue>· {screening.language}</Venue>}
          {screening.subtitles !== undefined && screening.subtitles !== '' && <Venue>· {screening.subtitles}</Venue>}
        </ScreeningItem>
      ))}
    </ScreeningsList>
  );
}

function YearCell({ year, isOldMovie }: { year?: number; isOldMovie: boolean }) {
  if (year == null) {
    return (
      <MovieYear isOldMovie={false} isUnknown title="Year unknown">
        —
      </MovieYear>
    );
  }

  return <MovieYear isOldMovie={isOldMovie}>{year}</MovieYear>;
}

export const MovieCard = memo(function MovieCard({
  movieKey,
  movie,
  isWeekend,
  isMorningOnly,
  movieDatesCount,
  listHits,
}: MovieCardProps) {
  const isOldMovie = movie.year !== undefined && movie.year < 2020;
  const datesCount = movieDatesCount.get(filmKey(movie)) ?? 1;
  const { siteUrl } = movie;

  return (
    <StyledMovieCard
      data-movie-key={movieKey}
      isWeekend={isWeekend}
      isMorningOnly={isMorningOnly}
      isOldMovie={isOldMovie}
    >
      <MovieTitleContainer>
        <MovieTitle movie={movie} isOldMovie={isOldMovie} />
      </MovieTitleContainer>

      <MovieMetadata>
        <Screenings movie={movie} datesCount={datesCount} idPrefix={movie.title} />
        {movie.durationMinutes !== undefined && movie.durationMinutes > 0 && (
          <MovieDuration>{movie.durationMinutes}min</MovieDuration>
        )}
        <YearCell year={movie.year} isOldMovie={isOldMovie} />
        {siteUrl !== undefined && siteUrl !== '' ? (
          <LinkButton
            onClick={() => {
              window.open(siteUrl, '_blank');
            }}
          >
            <FaExternalLinkAlt />
          </LinkButton>
        ) : (
          <MetaSpacer aria-hidden="true" />
        )}
      </MovieMetadata>
      {listHits && <ListBadges hits={listHits} />}
    </StyledMovieCard>
  );
});
