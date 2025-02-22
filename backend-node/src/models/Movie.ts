export interface Screening {
  dateTime: string;
  venue: string;
  language?: string;
  subtitles?: string;
}

export interface Movie {
  // Basic Info
  title: string;
  originalTitle?: string;
  altName?: string;
  year?: number;
  
  // Technical Details
  durationMinutes?: number;
  
  // URLs
  imgUrl?: string;
  siteUrl?: string;
  
  // Screenings
  screenings: Screening[];
} 