export interface Screening {
  dateTime: string;
  venue: string;
  language?: string;
  subtitles?: string;
}

export interface Movie {
  title: string;
  originalTitle?: string;
  altName?: string;
  year?: number;
  durationMinutes?: number;
  imgUrl?: string;
  siteUrl?: string;
  screenings: Screening[];
} 