import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PSAShowRelease } from '../model/PSAShowRelease.interface';
import { ElectronService } from '../services/electron.service';

@Component({
  selector: 'app-psa-release-list',
  templateUrl: './psa-release-list.component.html',
  styleUrls: ['./psa-release-list.component.scss']
})
export class PsaReleaseListComponent implements OnInit, OnDestroy {

  @Input() releases: PSAShowRelease[] = [];
  sub: Subscription;

  constructor(private es: ElectronService) {

    this.sub = this.es.messages$.subscribe({
      next: (data) => {

        switch (data.command) {

          case 'extract-started': 
            console.log('started', data);
            break;

          case 'extract-done': 
            console.log('done', data);
            break;

        }
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  ngOnInit(): void {
  }

  extractRelease({ name, exitLink }: PSAShowRelease): void {

    this.es.sendMessage({ command: 'extract-start', name, exitLink });
  }
}
