import { PSAMovieRelease } from './PSARelease.interface';

export interface PSAMovie {
  name: string;
  thumbnail: string;
  content: string;
  categories: string[];
  releases: PSAMovieRelease[];
}
