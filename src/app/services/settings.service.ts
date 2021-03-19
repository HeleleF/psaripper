import { Injectable } from '@angular/core';
import { AppSettings, DownloadMethod } from '../model/AppSettings.interface';

@Injectable({
	providedIn: 'root'
})
export class SettingsService {
	private cfg: AppSettings;
	private readonly SETTINGS_KEY = 'userData';

	constructor() {
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
	}

	getAll(): AppSettings {
		return this.cfg;
	}

	private get defaultUserData(): AppSettings {
		return {
			linksWhitelist: ['https://mega.nz'],
			linksBlacklist: [],
			downloadMethod: DownloadMethod.JD,
			jdAutoStart: true,
			qualities: '720p',
			language: 'en'
		};
	}

	save(): void {
		localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.cfg));
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
