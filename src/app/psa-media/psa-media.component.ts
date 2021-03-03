import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { PSACategory } from '../model/PSACategory.enum';
import { PsaContentComponent } from '../psa-content/psa-content.component';

import { Datasource, IDatasource } from 'ngx-ui-scroll';

import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { PsaService } from '../services/psa.service';

@Component({
	selector: 'app-psa-media',
	templateUrl: './psa-media.component.html',
	styleUrls: ['./psa-media.component.scss']
})
export class PsaMediaComponent implements OnInit, OnDestroy {
	mediaDatasource: IDatasource;

	readonly ALL_CATS = PSACategory;
	category: PSACategory = PSACategory.SHOW;
	readonly categories: string[];

	private readonly ITEMS_PER_ROW = 4;
	private readonly ITEMS_PER_PAGE = 14;

	constructor(private ps: PsaService, private modal: MatDialog) {
		this.categories = Object.keys(PSACategory);

		this.mediaDatasource = new Datasource({
			get: (startIndex: number, cnt: number) => {
				//console.groupCollapsed('GET');

				// !!!REQUESTET WERDEN ROWS, NICHT ITEMS!!!

				const endIndex = startIndex + cnt - 1;
				if (startIndex > endIndex) return of([]);

				//console.log(`startIndex: ${startIndex} -> endIndex: ${endIndex} | Rows needed: ${cnt}`);

				const startPage = Math.floor(
					(startIndex * this.ITEMS_PER_ROW) / this.ITEMS_PER_PAGE
				);
				const endPage = Math.floor(
					(endIndex * this.ITEMS_PER_ROW) / this.ITEMS_PER_PAGE
				);

				// 1. we need items, not rows
				const itemsNeeded = cnt * this.ITEMS_PER_ROW;

				// 2. request as much pages as needed to fulfill the request
				const pagesNeeded = endPage - startPage + 1;

				//console.log(`Items needed: ${itemsNeeded} -> Pages needed: ${pagesNeeded}, including pages ${startPage} through ${endPage}`);

				const pageRequests = Array.from(
					{ length: pagesNeeded },
					(_, pageNum) =>
						this.ps.getMediaByCategory(
							this.category,
							pageNum + startPage
						)
				);

				return forkJoin(pageRequests).pipe(
					map((listOfPages) => {
						let items = listOfPages.flat();

						// slice the needed sublist of items if needed
						if (items.length > itemsNeeded) {
							const start =
								(startIndex * this.ITEMS_PER_ROW) %
								this.ITEMS_PER_PAGE;
							items = items.slice(start, start + itemsNeeded);
						}

						return Array.from({ length: cnt }, (_, i) =>
							items.slice(
								i * this.ITEMS_PER_ROW,
								(i + 1) * this.ITEMS_PER_ROW
							)
						);
					})
					/*
          map(listOfPages => {
            return listOfPages.flat();
          }),
          tap(items => {
            console.log(`Recieved ${items.length} items -> First: ${items[0].name} | Last: ${items[items.length - 1].name}`);
          }),
          map(items => {

            // slice the needed sublist of items if needed
            if (items.length > itemsNeeded) {

              const start = startIndex * this.ITEMS_PER_ROW % this.ITEMS_PER_PAGE;
              items = items.slice(start, start + itemsNeeded);
            }

            // item list is now evenly chunkable by ITEMS_PER_ROW
            const rows = Array.from({ length: cnt }, (_, i) => items.slice(i * this.ITEMS_PER_ROW, (i + 1) * this.ITEMS_PER_ROW));
            return rows;
          }),
          tap(rows => {
            console.log(`Got ${rows.length} rows:\n${rows.map(row => `[ ${row.map(m => m.name.padEnd(12, ' ')).join('| ')} ]`).join('\n')}`);
            console.groupEnd();
          })
          */
				);
			},
			settings: {
				minIndex: 0,
				startIndex: 0,
				bufferSize: 7
			}
		});
	}

	ngOnInit(): void {}

	ngOnDestroy(): void {
		console.log('were done');
		this.ps.saveCache();
	}

	reload(newCategory?: PSACategory): void {
		if (newCategory) {
			this.category = newCategory;
		}
		console.log(this.category);

		this.mediaDatasource.adapter?.reload(0);
	}

	clearCache(): void {
		this.ps.deleteCache();
		this.mediaDatasource.adapter?.reload(0);
	}

	openMediumModal(fullLink: string): void {
		const psaContent$ = this.ps.getContentByFullLink(fullLink);

		this.modal.open(PsaContentComponent, {
			width: 'auto',
			minWidth: '1255px',
			maxWidth: 'calc(100vw - 120px)',
			height: 'auto',
			minHeight: 'calc(100vh - 90px)', // hier evntl noch ein maxHeight
			data: { psaContent$ },
			panelClass: 'content-panel',
			backdropClass: 'content-backdrop'
		});
	}
}
