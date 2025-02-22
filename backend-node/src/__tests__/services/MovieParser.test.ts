import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { MovieParser } from '../../services/MovieParser';

describe('MovieParser', () => {
  it('should parse movie data from HTML', () => {
    // Given
    const htmlContent = fs.readFileSync(
      path.join(__dirname, '../../__fixtures__/sample-movie-page.html'),
      'utf-8'
    );
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // When
    const movies = MovieParser.parse(document);

    // Then
    expect(movies).not.toHaveLength(0);

    // Check for specific movie
    const dearEvanHansen = movies.find(movie => movie.title === 'אוון הנסן היקר');
    expect(dearEvanHansen).toBeDefined();

    if (dearEvanHansen) {
      expect(dearEvanHansen.screenings).not.toHaveLength(0);
      
      const firstScreening = dearEvanHansen.screenings[0];
      expect(firstScreening.dateTime).toBeTruthy();
      expect(firstScreening.venue).toBeTruthy();
    }

    // Verify no duplicate movies
    const uniqueTitles = new Set(movies.map(movie => movie.title));
    expect(uniqueTitles.size).toBe(movies.length);
  });

  it('should parse movie with english alt name and metadata correctly', () => {
    // Given
    const htmlContent = fs.readFileSync(
      path.join(__dirname, '../../__fixtures__/cinema_co_il_schedule.html'),
      'utf-8'
    );
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // When
    const movies = MovieParser.parseFromDateHtml(document);

    // Then
    const movie = movies.find(m => m.title === 'הבעלים לשעבר');
    expect(movie).toBeDefined();
    expect(movie?.year).toBe(2023);
    expect(movie?.altName).toBe('Ex-Husbands');
    expect(movie?.imgUrl).toBe('https://www.cinema.co.il/wp-content/uploads/2024/08/הבעלים-לשעבר.jpg');
    expect(movie?.siteUrl).toBe('https://www.cinema.co.il/event/%d7%94%d7%91%d7%a2%d7%9c%d7%99%d7%9d-%d7%9c%d7%a9%d7%a2%d7%91%d7%a8/');
    
    const screening = movie?.screenings.find(s => 
      s.dateTime === '2025-01-25 11:30' && 
      s.venue === 'Cinematheque TLV'
    );
    expect(screening).toBeDefined();
  });

  it('should parse movie with english alt name from description correctly', () => {
    // Given
    const htmlContent = fs.readFileSync(
      path.join(__dirname, '../../__fixtures__/cinema_co_il_schedule.html'),
      'utf-8'
    );
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // When
    const movies = MovieParser.parseFromDateHtml(document);

    // Then
    const movie = movies.find(m => m.title === 'הסיפור של סולימן');
    expect(movie).toBeDefined();
    expect(movie?.altName).toBe('The Story of Souleymane');
  });
}); 