export enum DownloadMethod {
	JD = 'jdownloader',
	MEGA_CMD = 'mega command line',
	BROWSER = 'open browser'
}

export type Quality = '720p' | '1080p' | '1440p' | '2160p';

export interface AppSettings {
	linksWhitelist: string[];
	linksBlacklist: string[];
	downloadMethod: DownloadMethod;
	cfCookie: string | null;
	ouoIndices: number[];
	jdAutoStart: boolean;
	qualities: Quality;
	language: 'en' | 'de';
}

export interface DownloadResult {
	success: boolean;
	message?: string;
}
