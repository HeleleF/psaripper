import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Observable, TimeoutError } from 'rxjs';
import { shareReplay, timeout } from 'rxjs/operators';

import { PSAShow } from '../model/PSAShow.interface';

@Component({
  selector: 'app-psa-content',
  templateUrl: './psa-content.component.html',
  styleUrls: ['./psa-content.component.scss']
})
export class PsaContentComponent implements OnInit {

  content$: Observable<PSAShow>;
  private readonly TIMEOUT = 3500;

  constructor(
    public popup: MatDialogRef<PsaContentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { psaContent$: Observable<PSAShow> }
  ) {

    this.content$ = this.data.psaContent$.pipe(
      timeout(this.TIMEOUT),
      shareReplay(1)
    );
  }

  @HostListener('window:keyup.esc') onKeyUp() {
    this.popup.close();
  }

  ngOnInit(): void {

    this.content$.subscribe({
      error: (err: TimeoutError | HttpErrorResponse) => {

        if (err instanceof TimeoutError) {
          console.log(err.message, 'Zu lange gedauert');
          return this.popup.close();
        }

        // TODO(helene): content failed mit httpError. was dann?
        // popup instant zu machen ist blöd, fehlermeldung anzeigen?
        

      }
    });

  }
}
