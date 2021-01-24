import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { PSAShowRelease } from '../model/PSAShowRelease.interface';
import { ExtractAndDownloadService } from '../services/extract-and-download.service';

@Component({
  selector: 'app-psa-release-list',
  templateUrl: './psa-release-list.component.html',
  styleUrls: ['./psa-release-list.component.scss']
})
export class PsaReleaseListComponent implements OnInit, OnDestroy {

  @Input() releases: PSAShowRelease[] = [];

  constructor(
    private eds: ExtractAndDownloadService,
    private ngZone: NgZone
  ) {
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  extractRelease(index: number) {

    const rel = this.releases[index];
    this.eds.startExtract(rel);
  }
}
