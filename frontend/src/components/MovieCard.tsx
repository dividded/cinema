import React from 'react';
import { Movie } from '../types/movie';
import {
  MovieCard as StyledMovieCard,
  MovieTitleContainer,
  MovieTitleText,
  OriginalTitle,
  MovieYear,
  MovieMetadata,
  LinkButton
} from './styled/MovieCard';
import {
  ScreeningsList,
  ScreeningItem,
  DateTime,
  Venue,
  MultiDateIndicator,
  ScreeningsSeparator
} from './styled/Screening';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface MovieCardProps {
  movie: Movie;
  isWeekend: boolean;
  isMorningOnly: boolean;
  movieDatesCount: { [title: string]: number };
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isWeekend,
  isMorningOnly,
  movieDatesCount
}) => {
  const isOldMovie = movie.year ? movie.year < 2020 : false;

  return (
    <StyledMovieCard
      isWeekend={isWeekend}
      isMorningOnly={isMorningOnly}
      isOldMovie={isOldMovie}
    >
      <MovieTitleContainer>
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
        <ScreeningsSeparator />
        <ScreeningsList>
          {movieDatesCount[movie.title] > 1 && (
            <MultiDateIndicator>
              {movieDatesCount[movie.title]} dates
            </MultiDateIndicator>
          )}
          {movie.screenings.slice(0, 2).map((screening, index) => (
            <ScreeningItem key={`${movie.title}-${index}`}>
              <DateTime>{screening.dateTime.split(' ')[1]}</DateTime>
              <Venue>{screening.venue === 'Cinematheque TLV' ? 'TLV' : screening.venue}</Venue>
              {screening.language && <Venue>· {screening.language}</Venue>}
              {screening.subtitles && <Venue>· {screening.subtitles}</Venue>}
            </ScreeningItem>
          ))}
        </ScreeningsList>
      </MovieTitleContainer>
      <MovieMetadata>
        {movie.year && <MovieYear isOldMovie={isOldMovie}>{movie.year}</MovieYear>}
        {movie.durationMinutes && (
          <MovieYear isOldMovie={false}>{movie.durationMinutes}min</MovieYear>
        )}
        {movie.siteUrl && (
          <LinkButton onClick={() => window.open(movie.siteUrl, '_blank')}>
            <FaExternalLinkAlt />
          </LinkButton>
        )}
      </MovieMetadata>
    </StyledMovieCard>
  );
}; 