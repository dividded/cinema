import { Movie, Screening } from '../models/Movie';
import { createLogger } from '../utils/Logger';

const logger = createLogger('MovieParser');

const HEBREW = /[֐-׿]/;

/** An element's trimmed text, or '' when the element or its text is missing. */
const textOf = (element: Element | null | undefined): string => element?.textContent.trim() ?? '';

/** The English name before any Hebrew in "… | English Name עברית …". */
function altNameFrom(description: string): string {
  const part = description.split('|')[1]?.trim() ?? '';
  const hebrewAt = part.search(HEBREW);
  return (hebrewAt === -1 ? part : part.slice(0, hebrewAt)).trim();
}

/** A four-digit year in the element's text, if any. */
function yearIn(element: Element | null | undefined): number | undefined {
  const match = /\d{4}/.exec(textOf(element));
  return match ? parseInt(match[0], 10) : undefined;
}

/** "שבת 25.01.25" -> "2025-01-25" */
function dateFromHeader(header: string): string | undefined {
  const parts = header.split(' ')[1]?.split('.');
  if (parts?.length !== 3) return undefined;
  const [day, month, year] = parts;
  return `20${year}-${month}-${day}`;
}

/** Legacy parser for the old per-movie page layout. */
function parse(document: Document): Movie[] {
  const movieMap = new Map<string, Movie>();

  const titleDivs = document.querySelectorAll('div.title');
  logger.debug('Found title divs:', titleDivs.length);

  titleDivs.forEach((titleDiv, index) => {
    const title = textOf(titleDiv.querySelector('h3'));
    logger.debug(`Movie ${index + 1} title:`, title);

    let movie = movieMap.get(title);
    if (!movie) {
      movie = { title, screenings: [] };
      movieMap.set(title, movie);
    }

    const screeningBlocks = titleDiv.querySelectorAll('div.n_block_r');
    logger.debug(`Found ${screeningBlocks.length} screening blocks for movie:`, title);

    for (const screeningBlock of screeningBlocks) {
      const screeningText = textOf(screeningBlock.querySelector('p'));
      // Format: "25-01-2025 | שבת | 11:00"
      const [date, , time] = screeningText.split('|').map(part => part.trim());
      if (date !== undefined && time !== undefined) {
        const screening: Screening = { dateTime: `${date} ${time}`, venue: 'סינמטק תל אביב' };
        movie.screenings.push(screening);
        logger.debug('Added screening:', screening);
      }
    }
  });

  const movies = Array.from(movieMap.values());
  logger.debug('Total movies parsed:', movies.length);
  return movies;
}

interface MovieData {
  altName?: string;
  year?: number;
  imgUrl?: string;
  siteUrl?: string;
  screenings: Screening[];
}

function addOrUpdateMovie(movieMap: Map<string, Movie>, title: string, data: MovieData): void {
  let movie = movieMap.get(title);
  if (!movie) {
    movie = {
      title,
      altName: data.altName,
      year: data.year,
      imgUrl: data.imgUrl,
      siteUrl: data.siteUrl,
      screenings: [],
    };
    movieMap.set(title, movie);
  }

  for (const screening of data.screenings) {
    if (!movie.screenings.some(s => s.dateTime === screening.dateTime && s.venue === screening.venue)) {
      movie.screenings.push(screening);
    }
  }
}

const nonEmpty = (value: string | null | undefined): string | undefined =>
  value === null || value === undefined || value === '' ? undefined : value;

const screeningAt = (date: string, time: string): Screening => ({
  dateTime: date === '' ? time : `${date} ${time}`,
  venue: 'Cinematheque TLV',
});

/** A movie in the grid layout: one movie per div.text-content. */
function extractMovieFromContainer(content: Element, date: string, movieMap: Map<string, Movie>): void {
  const titleElement = content.querySelector('div.title');
  const titleLink = titleElement?.querySelector('h3 a') ?? titleElement?.querySelector('a');
  const title = textOf(titleLink);
  if (title === '') return;

  const description =
    nonEmpty(content.querySelector('div.paragraph p')?.textContent) ?? content.querySelector('div.desc')?.textContent ?? '';
  const imgUrl =
    nonEmpty(content.parentElement?.querySelector('div.img-wraper img[src$=".jpg"]')?.getAttribute('src')) ??
    nonEmpty(content.querySelector('img[src$=".jpg"]')?.getAttribute('src'));

  const times = Array.from(content.querySelectorAll('a.cal_link span.time, span.time, div.time'))
    .map(element => textOf(element))
    .filter(time => time !== '');

  addOrUpdateMovie(movieMap, title, {
    altName: nonEmpty(altNameFrom(description)),
    year: yearIn(titleElement?.querySelector('p')),
    imgUrl,
    siteUrl: nonEmpty(titleLink?.getAttribute('href')),
    screenings: times.map(time => screeningAt(date, time)),
  });
}

/** A movie inside a popup (div.outer-wrapper), which can hold several movies sharing one time. */
function extractMovieFromTitleElement(
  titleElement: Element,
  container: Element,
  date: string,
  movieMap: Map<string, Movie>,
): void {
  const titleLink = titleElement.querySelector('h3 a') ?? titleElement.querySelector('a');
  const title = textOf(titleLink);
  if (title === '') return;

  const descElement = titleElement.nextElementSibling;
  const description = descElement?.classList.contains('desc') === true ? textOf(descElement) : '';
  const time = textOf(container.querySelector('div.time'));

  addOrUpdateMovie(movieMap, title, {
    altName: nonEmpty(altNameFrom(description)),
    year: yearIn(titleElement.querySelector('p')),
    imgUrl: undefined, // popups don't carry images
    siteUrl: nonEmpty(titleLink?.getAttribute('href')),
    screenings: time === '' ? [] : [screeningAt(date, time)],
  });
}

/** Parses a day's schedule page (https://www.cinema.co.il/shown/?date=YYYY-MM-DD). */
function parseFromDateHtml(document: Document): Movie[] {
  // The page's own date header, falling back to the ?date= of the page URL.
  const date =
    dateFromHeader(textOf(document.querySelector('span.main-date'))) ??
    new URLSearchParams(document.location.search).get('date') ??
    '';

  const movieMap = new Map<string, Movie>();
  for (const content of document.querySelectorAll('div.text-content')) {
    extractMovieFromContainer(content, date, movieMap);
  }
  for (const wrapper of document.querySelectorAll('div.outer-wrapper')) {
    for (const titleElement of wrapper.querySelectorAll('div.title')) {
      extractMovieFromTitleElement(titleElement, wrapper, date, movieMap);
    }
  }
  return Array.from(movieMap.values());
}

export const MovieParser = { parse, parseFromDateHtml };
