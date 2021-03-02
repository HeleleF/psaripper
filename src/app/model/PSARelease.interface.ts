export interface PSAShowRelease {
  name: string;
  sizeMB: number;
  source: string;
  hasSubtitles: boolean;
  exitLinks: string[];
  season: number;
  episode: number;
}

export interface PSAMovieRelease {
  name: string;
  sizeMB: number;
  source: string;
  hasSubtitles: boolean;
  exitLinks: string[]; // movie can have multiple parts
}