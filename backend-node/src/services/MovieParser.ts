import { Movie, Screening } from '../models/Movie';

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
    document.querySelectorAll('div.title').forEach(titleDiv => {
      // Extract movie title
      const title = titleDiv.querySelector('h3')?.textContent?.trim() || '';
      
      // Get or create movie
      let movie = movieMap.get(title);
      if (!movie) {
        movie = { title, screenings: [] };
        movieMap.set(title, movie);
      }
      
      // Extract screening details
      titleDiv.querySelectorAll('div.n_block_r').forEach(screeningBlock => {
        const screeningText = screeningBlock.querySelector('p')?.textContent?.trim() || '';
        
        // Parse screening details (format: "25-01-2025 | שבת | 11:00")
        const screeningParts = screeningText.split('|').map(part => part.trim());
        if (screeningParts.length >= 3) {
          const screening: Screening = {
            dateTime: `${screeningParts[0]} ${screeningParts[2]}`, // Combine date and time
            venue: 'סינמטק תל אביב'
          };
          movie.screenings.push(screening);
        }
      });
    });
    
    return Array.from(movieMap.values());
  }

  static parseFromDateHtml(document: Document): Movie[] {
    const dateText = document.querySelector('span.main-date')?.textContent
      ?.split(' ')[1]  // "שבת 25.01.25" -> "25.01.25"
      ?.split('.')     // ["25", "01", "25"]
      ?.map((part, i) => i === 2 ? `20${part}` : part)  // Convert year to full format
      ?.reverse()      // Reverse to get year first
      ?.join('-') || '';  // Join with dashes

    return Array.from(document.querySelectorAll('div.text-content')).map(content => {
      const titleElement = content.querySelector('div.title');
      const yearMatch = titleElement?.querySelector('p')?.textContent
        ?.match(/\d{4}/)?.[0];

      const description = content.querySelector('div.paragraph p')?.textContent || '';
      const altNamePart = description.split('|')[1]?.trim() || '';
      const altName = takeWhile(altNamePart.split(''), char => !(/[\u0590-\u05FF]/.test(char)))
        .join('')
        .trim();

      const imgUrl = content.parentElement
        ?.querySelector('div.img-wraper img[src$=".jpg"]')
        ?.getAttribute('src');

      const siteUrl = titleElement
        ?.querySelector('h3 a')
        ?.getAttribute('href');

      return {
        title: titleElement?.querySelector('h3 a')?.textContent?.trim() || '',
        altName: altName || undefined,
        year: yearMatch ? parseInt(yearMatch) : undefined,
        imgUrl: imgUrl || undefined,
        siteUrl: siteUrl || undefined,
        screenings: Array.from(content.querySelectorAll('a.cal_link span.time'))
          .map(time => ({
            dateTime: `${dateText} ${time.textContent || ''}`,
            venue: 'Cinematheque TLV'
          }))
      };
    });
  }
} 