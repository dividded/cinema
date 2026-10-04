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

interface MovieCardProps {
  movieKey: string;
  movie: Movie;
  isWeekend: boolean;
  isMorningOnly: boolean;
  movieDatesCount: { [title: string]: number };
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
      {movie.altName && movie.title !== movie.altName ? (
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
          <DateTime>{screening.dateTime.split(' ')[1]}</DateTime>
          <Venue>{screening.venue === 'Cinematheque TLV' ? 'TLV' : screening.venue}</Venue>
          {screening.language && <Venue>· {screening.language}</Venue>}
          {screening.subtitles && <Venue>· {screening.subtitles}</Venue>}
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
  const isOldMovie = movie.year ? movie.year < 2020 : false;
  const datesCount = movieDatesCount[movie.title];

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
        {movie.durationMinutes && (
          <MovieDuration>{movie.durationMinutes}min</MovieDuration>
        )}
        <YearCell year={movie.year} isOldMovie={isOldMovie} />
        {movie.siteUrl ? (
          <LinkButton onClick={() => window.open(movie.siteUrl, '_blank')}>
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
