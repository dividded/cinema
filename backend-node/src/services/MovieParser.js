"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieParser = void 0;
// Helper function to mimic Kotlin's takeWhile
function takeWhile(arr, predicate) {
    const result = [];
    for (const item of arr) {
        if (!predicate(item))
            break;
        result.push(item);
    }
    return result;
}
class MovieParser {
    static parse(document) {
        const movieMap = new Map();
        // Find all movie blocks
        const titleDivs = document.querySelectorAll('div.title');
        console.log('Found title divs:', titleDivs.length);
        titleDivs.forEach((titleDiv, index) => {
            var _a;
            // Extract movie title
            const titleElement = titleDiv.querySelector('h3');
            const title = ((_a = titleElement === null || titleElement === void 0 ? void 0 : titleElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            console.log(`Movie ${index + 1} title:`, title);
            // Get or create movie
            let movie = movieMap.get(title);
            if (!movie) {
                movie = { title, screenings: [] };
                movieMap.set(title, movie);
            }
            // Extract screening details
            const screeningBlocks = titleDiv.querySelectorAll('div.n_block_r');
            console.log(`Found ${screeningBlocks.length} screening blocks for movie:`, title);
            screeningBlocks.forEach(screeningBlock => {
                var _a, _b;
                const screeningText = ((_b = (_a = screeningBlock.querySelector('p')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                console.log('Screening text:', screeningText);
                // Parse screening details (format: "25-01-2025 | שבת | 11:00")
                const screeningParts = screeningText.split('|').map(part => part.trim());
                if (screeningParts.length >= 3) {
                    const screening = {
                        dateTime: `${screeningParts[0]} ${screeningParts[2]}`, // Combine date and time
                        venue: 'סינמטק תל אביב'
                    };
                    movie.screenings.push(screening);
                    console.log('Added screening:', screening);
                }
            });
        });
        const movies = Array.from(movieMap.values());
        console.log('Total movies parsed:', movies.length);
        return movies;
    }
    static parseFromDateHtml(document) {
        var _a, _b, _c, _d, _e, _f, _g;
        // Extract date from URL parameter as fallback
        const urlParams = new URLSearchParams(((_a = document.location) === null || _a === void 0 ? void 0 : _a.search) || '');
        const urlDate = urlParams.get('date');
        // Try to extract date from main-date span, fallback to URL param
        const dateText = ((_g = (_f = (_e = (_d = (_c = (_b = document.querySelector('span.main-date')) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.split(' ')[1] // "שבת 25.01.25" -> "25.01.25"
        ) === null || _d === void 0 ? void 0 : _d.split('.') // ["25", "01", "25"]
        ) === null || _e === void 0 ? void 0 : _e.map((part, i) => i === 2 ? `20${part}` : part) // Convert year to full format
        ) === null || _f === void 0 ? void 0 : _f.reverse() // Reverse to get year first
        ) === null || _g === void 0 ? void 0 : _g.join('-')) || urlDate || '';
        const movieMap = new Map();
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
    static _extractMovieFromContainer(content, dateText, movieMap) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const titleElement = content.querySelector('div.title');
        const titleLink = (titleElement === null || titleElement === void 0 ? void 0 : titleElement.querySelector('h3 a')) || (titleElement === null || titleElement === void 0 ? void 0 : titleElement.querySelector('a'));
        const title = ((_a = titleLink === null || titleLink === void 0 ? void 0 : titleLink.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        if (!title)
            return; // Skip if no title found
        // Extract year from title paragraph
        const yearMatch = (_d = (_c = (_b = titleElement === null || titleElement === void 0 ? void 0 : titleElement.querySelector('p')) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.match(/\d{4}/)) === null || _d === void 0 ? void 0 : _d[0];
        // Extract alt name from description
        const description = ((_e = content.querySelector('div.paragraph p')) === null || _e === void 0 ? void 0 : _e.textContent) ||
            ((_f = content.querySelector('div.desc')) === null || _f === void 0 ? void 0 : _f.textContent) || '';
        const altNamePart = ((_g = description.split('|')[1]) === null || _g === void 0 ? void 0 : _g.trim()) || '';
        const altName = takeWhile(altNamePart.split(''), char => !(/[\u0590-\u05FF]/.test(char)))
            .join('')
            .trim();
        // Extract image URL (try both structures)
        const imgUrl = ((_j = (_h = content.parentElement) === null || _h === void 0 ? void 0 : _h.querySelector('div.img-wraper img[src$=".jpg"]')) === null || _j === void 0 ? void 0 : _j.getAttribute('src')) ||
            ((_k = content.querySelector('img[src$=".jpg"]')) === null || _k === void 0 ? void 0 : _k.getAttribute('src'));
        // Extract site URL
        const siteUrl = titleLink === null || titleLink === void 0 ? void 0 : titleLink.getAttribute('href');
        // Extract screenings - try multiple selectors
        const timeElements = Array.from(content.querySelectorAll('a.cal_link span.time, span.time, div.time'));
        const screenings = timeElements
            .map(time => { var _a; return (_a = time.textContent) === null || _a === void 0 ? void 0 : _a.trim(); })
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
    static _extractMovieFromTitleElement(titleElement, container, dateText, movieMap) {
        var _a, _b, _c, _d, _e, _f;
        const titleLink = titleElement.querySelector('h3 a') || titleElement.querySelector('a');
        const title = ((_a = titleLink === null || titleLink === void 0 ? void 0 : titleLink.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        if (!title)
            return;
        // Extract year - look at the paragraph near this title element
        const yearMatch = (_d = (_c = (_b = titleElement.querySelector('p')) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.match(/\d{4}/)) === null || _d === void 0 ? void 0 : _d[0];
        // Extract alt name from description near this title
        const descElement = titleElement.nextElementSibling;
        const description = (descElement === null || descElement === void 0 ? void 0 : descElement.classList.contains('desc')) ? descElement === null || descElement === void 0 ? void 0 : descElement.textContent : '';
        const altNamePart = ((_e = description === null || description === void 0 ? void 0 : description.split('|')[1]) === null || _e === void 0 ? void 0 : _e.trim()) || '';
        const altName = takeWhile(altNamePart.split(''), char => !(/[\u0590-\u05FF]/.test(char)))
            .join('')
            .trim();
        // Extract site URL
        const siteUrl = titleLink === null || titleLink === void 0 ? void 0 : titleLink.getAttribute('href');
        // For outer-wrapper, the time is in a sibling div.time at the wrapper level
        const timeElement = container.querySelector('div.time');
        const time = (_f = timeElement === null || timeElement === void 0 ? void 0 : timeElement.textContent) === null || _f === void 0 ? void 0 : _f.trim();
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
    static _addOrUpdateMovie(movieMap, title, data) {
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
            if (!movie.screenings.some(s => s.dateTime === screening.dateTime && s.venue === screening.venue)) {
                movie.screenings.push(screening);
            }
        });
    }
}
exports.MovieParser = MovieParser;
