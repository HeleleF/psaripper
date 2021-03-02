import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PSAMovieRelease, PSAShowRelease } from '../model/PSARelease.interface';
import { ExtractAndDownloadService } from '../services/extract-and-download.service';

@Component({
  selector: 'app-psa-release-list',
  templateUrl: './psa-release-list.component.html',
  styleUrls: ['./psa-release-list.component.scss']
})
export class PsaReleaseListComponent implements OnInit, OnDestroy {

  @Input() releases: (PSAShowRelease | PSAMovieRelease)[] = [];

  constructor(
    private eds: ExtractAndDownloadService
  ) {
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  extractRelease(index: number): void {

    const rel = this.releases[index];
    this.eds.startExtract(rel);
  }
}
