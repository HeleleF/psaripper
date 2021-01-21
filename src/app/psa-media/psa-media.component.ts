import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PSACategory } from '../model/PSACategory.enum';
import { PSAMedium } from '../model/PSAMedium.interface';
import { PsaContentComponent } from '../psa-content/psa-content.component';

import { Datasource, IDatasource } from 'ngx-ui-scroll';

import { Observable, of, zip } from 'rxjs';
import { map } from 'rxjs/operators';

import { PsaService } from '../services/psa.service';

@Component({
  selector: 'app-psa-media',
  templateUrl: './psa-media.component.html',
  styleUrls: ['./psa-media.component.scss']
})
export class PsaMediaComponent implements OnInit {

  mediaDatasource: IDatasource;
  pageSize = 14;
  category: PSACategory = PSACategory.SHOW;

  constructor(
    private ps: PsaService,
    private modal: MatDialog
  ) {

    this.mediaDatasource = new Datasource({
      get: (startIndex: number, cnt: number) => {

        const endIndex = startIndex + cnt - 1;

        if (startIndex > endIndex) return of([]);

        const startPage = Math.floor(startIndex / this.pageSize);
        const endPage = Math.floor(endIndex / this.pageSize);
    
        const pagesRequest: Observable<PSAMedium[]>[] = [];

        for (let i = startPage; i <= endPage; i++) {
          pagesRequest.push(this.ps.getMediaByCategory(this.category, i));
        }

        return zip(...pagesRequest).pipe(
          map(itemsList => {

            const start = startIndex - startPage * this.pageSize;
            const end = start + cnt;

            return itemsList.flat().slice(start, end);
          })
        );
      },
      settings: {
        minIndex: 0,
        startIndex: 0,
        bufferSize: 14,
      }
    });

  }

  ngOnInit(): void { 
  }

  reload(newCategory?: PSACategory): void {

    if (newCategory) {
      this.category = newCategory;
    }

    this.mediaDatasource.adapter?.reload(0);
  }

  openMediumModal(id: string): void {

    const psaContent$ = this.ps.getShowById(id);

    this.modal.open(PsaContentComponent, { 
      width: 'auto',
      minWidth: '1255px',
      maxWidth: 'calc(100vw - 120px)',
      height: 'auto', 
      minHeight: 'calc(100vh - 90px)',
      data: { psaContent$ },
      panelClass: 'content-panel'
    });
  }
}
