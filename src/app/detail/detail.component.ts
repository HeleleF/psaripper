import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { AppSettings } from '../model/AppSettings.interface';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {

  settings: AppSettings;

  constructor(private ss: SettingsService) {

    this.settings = this.ss.getAll();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.ss.save();
  }

  saveD() {
    console.log(this.settings);
    this.ss.update('downloadMethod', this.settings.downloadMethod);
  }
}
