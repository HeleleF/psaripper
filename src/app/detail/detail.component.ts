import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { AppSettings } from '../model/AppSettings.interface';
import { ElectronService } from '../services/electron.service';

@Component({
	selector: 'app-detail',
	templateUrl: './detail.component.html',
	styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnDestroy {
	settings: AppSettings;
	indices: string;

	constructor(private ss: SettingsService, private es: ElectronService) {
		this.settings = this.ss.getAll();
		this.indices = this.settings.ouoIndices.join(',');

	}

	ngOnDestroy(): void {
		this.ss.save();
	}

	reload(): void {}

	saveD(): void {
		console.log(this.settings.downloadMethod);
		this.ss.update('downloadMethod', this.settings.downloadMethod);
	}

	saveIndices(): void {
		console.log('indices', this.indices);
		this.ss.update('ouoIndices', this.indices.split(',').map(Number));
	}

	openDev(): void {
		this.es.ipcRenderer?.send('cmd-to-main', { command: 'open-devtools' });
	}
}
