export interface Screening {
  dateTime: string;
  venue: string;
  language?: string;
  subtitles?: string;
}

export interface Movie {
  title: string;
  originalTitle?: string;
  year?: number;
  durationMinutes?: number;
  screenings: Screening[];
} 