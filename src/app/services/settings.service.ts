import { Injectable } from '@angular/core';
import { AppSettings, DownloadMethod } from '../model/AppSettings.interface';
import { ElectronService } from './electron.service';

@Injectable({
	providedIn: 'root'
})
export class SettingsService {
	private cfg: AppSettings;
	private readonly SETTINGS_KEY = 'userData';

	constructor(private es: ElectronService) {
		const data = localStorage.getItem(this.SETTINGS_KEY);
		const defaultData = this.defaultUserData;

		if (!data) {
			this.cfg = defaultData;
			localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.cfg));
			return;
		}

		// merge with defaults to always guarantee correct settings
		this.cfg = {
			...defaultData,
			...JSON.parse(data)
		};

		console.log('df', JSON.stringify(this.cfg));

		this.es.sendMessage({
			command: 'settings',
			settings: this.cfg
		});
	}

	getAll(): AppSettings {
		return this.cfg;
	}

	private get defaultUserData(): AppSettings {
		console.log('tetds');
		return {
			linksWhitelist: ['https://mega.nz'],
			linksBlacklist: [],
			downloadMethod: DownloadMethod.JD,
			cfCookie: null,
			ouoIndices: [4, 7, 8, 14, 15],
			jdAutoStart: true,
			qualities: '720p',
			language: 'en'
		};
	}

	save(): void {
		localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.cfg));
		this.es.sendMessage({
			command: 'settings',
			settings: this.cfg
		});
	}

	get<K extends keyof AppSettings>(key: K): AppSettings[K] {
		return this.cfg[key];
	}

	update<K extends keyof AppSettings>(
		key: K,
		newValue: AppSettings[K],
		forceSave = false
	): AppSettings[K] {
		this.cfg[key] = newValue;

		if (forceSave) this.save();

		return newValue;
	}
}
