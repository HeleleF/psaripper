import { Component, OnInit } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { ElectronService } from '../services/electron.service';
import { AppSettings } from '../model/AppSettings.interface';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  settings$: Observable<AppSettings>;

  constructor(private es: ElectronService) {

    this.settings$ = this.es.isElectron ? from(this.es.ipcRenderer!.invoke('get-settings')) : of({ msg: 'not electron' });
  }

  ngOnInit(): void {
  }

}
