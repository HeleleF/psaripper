import { Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PSAShowRelease } from '../model/PSAShowRelease.interface';
import { ElectronService } from '../services/electron.service';

@Component({
  selector: 'app-psa-release-list',
  templateUrl: './psa-release-list.component.html',
  styleUrls: ['./psa-release-list.component.scss']
})
export class PsaReleaseListComponent implements OnInit, OnDestroy {

  @ViewChild('yourTarget', { static: true }) yourTarget!: ElementRef<HTMLUListElement>;

  @Input() releases: PSAShowRelease[] = [];

  constructor(private es: ElectronService, private ngZone: NgZone) {
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  async extractRelease(index: number): Promise<void> {

    const rel = this.releases[index];
    const result = await this.es.ipcRenderer!.invoke('extract', rel);

    this.ngZone.run(() => {
      this.releases[index] = {...rel, ex: result };
    });

    
  }
}
