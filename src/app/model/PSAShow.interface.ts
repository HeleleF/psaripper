import { PSAShowRelease } from './PSARelease.interface';

export interface PSAShow {
	name: string;
	thumbnail: string;
	content: string;
	categories: string[];
	releases: PSAShowRelease[];
}

export interface EpisodeInfo {
	season: number;
	episode: number;
}
