import { Movie, Screening } from '../models/Movie';
import { createLogger } from '../utils/Logger';

const logger = createLogger('MovieParser');

// Helper function to mimic Kotlin's takeWhile
function takeWhile(arr: string[], predicate: (char: string) => boolean): string[] {
  const result: string[] = [];
  for (const item of arr) {
    if (!predicate(item)) break;
    result.push(item);
  }
  return result;
}

export class MovieParser {
  static parse(document: Document): Movie[] {
    const movieMap = new Map<string, Movie>();
    
    // Find all movie blocks
    const titleDivs = document.querySelectorAll('div.title');
    logger.debug('Found title divs:', titleDivs.length);
    
    titleDivs.forEach((titleDiv, index) => {
      // Extract movie title
      const titleElement = titleDiv.querySelector('h3');
      const title = titleElement?.textContent?.trim() || '';
      logger.debug(`Movie ${index + 1} title:`, title);
      
      // Get or create movie
      let movie = movieMap.get(title);
      if (!movie) {
        movie = { title, screenings: [] };
        movieMap.set(title, movie);
      }
      
      // Extract screening details
      const screeningBlocks = titleDiv.querySelectorAll('div.n_block_r');
      logger.debug(`Found ${screeningBlocks.length} screening blocks for movie:`, title);
      
      screeningBlocks.forEach(screeningBlock => {
        const screeningText = screeningBlock.querySelector('p')?.textContent?.trim() || '';
        logger.debug('Screening text:', screeningText);
        
        // Parse screening details (format: "25-01-2025 | שבת | 11:00")
        const screeningParts = screeningText.split('|').map(part => part.trim());
        if (screeningParts.length >= 3) {
          const screening: Screening = {
            dateTime: `${screeningParts[0]} ${screeningParts[2]}`, // Combine date and time
            venue: 'סינמטק תל אביב'
          };
          movie.screenings.push(screening);
          logger.debug('Added screening:', screening);
        }
      });
    });
    
    const movies = Array.from(movieMap.values());
    logger.debug('Total movies parsed:', movies.length);
    return movies;
  }

  static parseFromDateHtml(document: Document): Movie[] {
    // Extract date from URL parameter as fallback
    const urlParams = new URLSearchParams(document.location?.search || '');
    const urlDate = urlParams.get('date');
    
    // Try to extract date from main-date span, fallback to URL param
    const dateText = document.querySelector('span.main-date')?.textContent
      ?.split(' ')[1]  // "שבת 25.01.25" -> "25.01.25"
      ?.split('.')     // ["25", "01", "25"]
      ?.map((part, i) => i === 2 ? `20${part}` : part)  // Convert year to full format
      ?.reverse()      // Reverse to get year first
      ?.join('-') || urlDate || '';

    const movieMap = new Map<string, Movie>();

    // Look for movies in grid boxes (div.text-content structure)
    const textContentMovies = Array.from(document.querySelectorAll('div.text-content'));
    
    // For popup/modal (div.outer-wrapper), we need to handle multiple movies per wrapper
    const outerWrappers = Array.from(document.querySelectorAll('div.outer-wrapper'));
    
    // Process grid movies (one movie per text-content)
    textContentMovies.forEach(content => {
      this._extractMovieFromContainer(content, dateText, movieMap);
    });

    // Process outer-wrapper movies (can have multiple movies per wrapper)
    outerWrappers.forEach(wrapper => {
      // Each outer-wrapper can contain multiple movies, find all title elements
      const titleElements = wrapper.querySelectorAll('div.title');
      titleElements.forEach(titleElement => {
        // Create a pseudo-container for each movie within the wrapper
        this._extractMovieFromTitleElement(titleElement, wrapper, dateText, movieMap);
      });
    });

    return Array.from(movieMap.values());
  }

  private static _extractMovieFromContainer(content: Element, dateText: string, movieMap: Map<string, Movie>): void {
    const titleElement = content.querySelector('div.title');
    const titleLink = titleElement?.querySelector('h3 a') || titleElement?.querySelector('a');
    const title = titleLink?.textContent?.trim() || '';
    
    if (!title) return; // Skip if no title found

    // Extract year from title paragraph
    const yearMatch = titleElement?.querySelector('p')?.textContent?.match(/\d{4}/)?.[0];

    // Extract alt name from description
    const description = content.querySelector('div.paragraph p')?.textContent || 
                       content.querySelector('div.desc')?.textContent || '';
    const altNamePart = description.split('|')[1]?.trim() || '';
    const altName = takeWhile(altNamePart.split(''), char => !(/[\u0590-\u05FF]/.test(char)))
      .join('')
      .trim();

    // Extract image URL (try both structures)
    const imgUrl = content.parentElement?.querySelector('div.img-wraper img[src$=".jpg"]')?.getAttribute('src') ||
                   content.querySelector('img[src$=".jpg"]')?.getAttribute('src');

    // Extract site URL
    const siteUrl = titleLink?.getAttribute('href');

    // Extract screenings - try multiple selectors
    const timeElements = Array.from(
      content.querySelectorAll('a.cal_link span.time, span.time, div.time')
    );
    
    const screenings = timeElements
      .map(time => time.textContent?.trim())
      .filter(Boolean)
      .map(time => ({
        dateTime: dateText ? `${dateText} ${time}` : time || '',
        venue: 'Cinematheque TLV'
      }));

    this._addOrUpdateMovie(movieMap, title, {
      altName: altName || undefined,
      year: yearMatch ? parseInt(yearMatch) : undefined,
      imgUrl: imgUrl || undefined,
      siteUrl: siteUrl || undefined,
      screenings
    });
  }

  private static _extractMovieFromTitleElement(titleElement: Element, container: Element, dateText: string, movieMap: Map<string, Movie>): void {
    const titleLink = titleElement.querySelector('h3 a') || titleElement.querySelector('a');
    const title = titleLink?.textContent?.trim() || '';
    
    if (!title) return;

    // Extract year - look at the paragraph near this title element
    const yearMatch = titleElement.querySelector('p')?.textContent?.match(/\d{4}/)?.[0];

    // Extract alt name from description near this title
    const descElement = titleElement.nextElementSibling;
    const description = descElement?.classList.contains('desc') ? descElement?.textContent : '';
    const altNamePart = description?.split('|')[1]?.trim() || '';
    const altName = takeWhile(altNamePart.split(''), char => !(/[\u0590-\u05FF]/.test(char)))
      .join('')
      .trim();

    // Extract site URL
    const siteUrl = titleLink?.getAttribute('href');

    // For outer-wrapper, the time is in a sibling div.time at the wrapper level
    const timeElement = container.querySelector('div.time');
    const time = timeElement?.textContent?.trim();
    
    const screenings = time ? [{
      dateTime: dateText ? `${dateText} ${time}` : time,
      venue: 'Cinematheque TLV'
    }] : [];

    this._addOrUpdateMovie(movieMap, title, {
      altName: altName || undefined,
      year: yearMatch ? parseInt(yearMatch) : undefined,
      imgUrl: undefined, // outer-wrapper typically doesn't have images
      siteUrl: siteUrl || undefined,
      screenings
    });
  }

  private static _addOrUpdateMovie(
    movieMap: Map<string, Movie>,
    title: string,
    data: {
      altName?: string;
      year?: number;
      imgUrl?: string;
      siteUrl?: string;
      screenings: Screening[];
    }
  ): void {
    let movie = movieMap.get(title);
    if (!movie) {
      movie = {
        title,
        altName: data.altName,
        year: data.year,
        imgUrl: data.imgUrl,
        siteUrl: data.siteUrl,
        screenings: []
      };
      movieMap.set(title, movie);
    }

    // Add screenings, avoiding duplicates
    data.screenings.forEach(screening => {
      if (!movie!.screenings.some(s => s.dateTime === screening.dateTime && s.venue === screening.venue)) {
        movie!.screenings.push(screening);
      }
    });
  }
} 