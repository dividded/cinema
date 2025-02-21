import React from 'react';
import { Movie } from '../types/movie';
import {
  MovieCard as StyledMovieCard,
  MovieImagePreview,
  MovieTitleContainer,
  MovieTitleText,
  OriginalTitle,
  MovieYear
} from './styled/MovieCard';
import {
  ScreeningsList,
  ScreeningItem,
  DateTime,
  Venue,
  MultiDateIndicator
} from './styled/Screening';

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
      onClick={() => movie.siteUrl && window.open(movie.siteUrl, '_blank')}
      style={{ cursor: movie.siteUrl ? 'pointer' : 'default' }}
    >
      {movie.imgUrl && (
        <MovieImagePreview>
          <img src={movie.imgUrl} alt={movie.title} />
        </MovieImagePreview>
      )}
      <MovieTitleContainer>
        <MovieTitleText isOldMovie={isOldMovie}>
          {movie.altName && movie.title !== movie.altName ? (
            <>
              {movie.altName}
              <OriginalTitle>{movie.title}</OriginalTitle>
            </>
          ) : (
            movie.title
          )}
        </MovieTitleText>
        {movie.year && <MovieYear isOldMovie={isOldMovie}>{movie.year}</MovieYear>}
      </MovieTitleContainer>
      <ScreeningsList>
        {movieDatesCount[movie.title] > 1 && (
          <MultiDateIndicator>
            Showing on {movieDatesCount[movie.title]} dates
          </MultiDateIndicator>
        )}
        {movie.screenings.map((screening, index) => (
          <ScreeningItem key={`${movie.title}-${index}`}>
            <DateTime>{screening.dateTime.split(' ')[1]}</DateTime>
            <Venue>{screening.venue}</Venue>
          </ScreeningItem>
        ))}
      </ScreeningsList>
    </StyledMovieCard>
  );
}; 