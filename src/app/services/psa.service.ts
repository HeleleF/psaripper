/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { $, $$ } from '../shared/utils';

import { PSAMedium } from '../model/PSAMedium.interface';
import { PSAShow } from '../model/PSAShow.interface';
import { PSAMovie } from '../model/PSAMovie.interface';
import { PSACategory } from '../model/PSACategory.enum';
import { PSAShowRelease } from '../model/PSAShowRelease.interface';

@Injectable({
  providedIn: 'root'
})
export class PsaService {

  readonly PSA_DOMAIN = 'psarips.uk';
  dp: DOMParser;

  private readonly PSA_RELEASE_SIZE_PATTERN = /(?<size>(?:\d+|\d+\.\d+)) (?<byte>MB|GB)/;

  constructor(
    private http: HttpClient
  ) {

    this.dp = new DOMParser();
  }

  private getPSADocument(uri: string) {
    return this.http.get(uri, { responseType: 'text' })
      .pipe(
        catchError(this.handleError.bind(this)),
        map(html => this.dp.parseFromString(html, 'text/html'))
      );
  }

  private serializePSAMedia(doc: Document): PSAMedium[] {
    return Array.from({ ...doc.querySelectorAll('article'), length: 14 }, (maybeArticle: HTMLDivElement | undefined) => {

      if (!maybeArticle) return null;

      return {
        id: maybeArticle.id.slice(5),
        name: maybeArticle.querySelector('.post-title > a')!.textContent,
        thumbnail: (maybeArticle.querySelector('.post-thumbnail > a > img')! as HTMLImageElement).src,
        fullLink: (maybeArticle.querySelector('.post-thumbnail > a')! as HTMLAnchorElement).href,
        caption: maybeArticle.querySelector('.caption')!.textContent,
        excerpt: maybeArticle.querySelector('.excerpt > p')!.textContent,
        categories: [ ...maybeArticle.querySelectorAll('.post-category > a') ].map(a => a.textContent)
      } as PSAMedium;

    });
  }

  private getShowReleaseSize(elm: HTMLElement): number {

    const txt = $('p > strong > span', elm).nextSibling;
    if (!txt) return 0;

    const { groups } = this.PSA_RELEASE_SIZE_PATTERN.exec(txt.textContent) ?? {};
    if (!groups) return 0;

    return groups.byte === 'MB' ? parseFloat(groups.size) : parseFloat(groups.size) * 1000;
  }

  private getShowReleaseSource(elm: HTMLElement): string {

    const p = $('p:not([class]) > span > strong', elm)?.parentElement;
    return p?.nextSibling?.textContent ?? 'None';
  }

  private hasShowReleaseSubs(elm: HTMLElement): boolean {

    const p = $('.sp-body > p:last-of-type', elm).previousElementSibling;

    if (!p || p.textContent.includes('NONE')) return false;

    return true;
  }

  private createShowRelease(elm: HTMLElement): PSAShowRelease | null {

    const name = $('.sp-head', elm).textContent.trim();

    if (/[\u0337\u0336\u0335]/.test(name)) return null;

    return {
      name,
      sizeMB: this.getShowReleaseSize(elm),
      linkId: ($('strong > a', elm) as HTMLAnchorElement).pathname,
      source: this.getShowReleaseSource(elm),
      hasSubtitles: this.hasShowReleaseSubs(elm)
    };
  }

  private extractContent(root: Element | Document): string {

    let start = $('.entry-inner p', root);

    while (!start.textContent.trim().length) {
      start = start.nextElementSibling as HTMLElement;
    }

    return start.textContent;
  }

  private serializePSAShow(doc: Document): PSAShow {

    return {
      name: $('.post-title', doc).textContent,
      content: this.extractContent(doc),
      categories: $$('.category a', doc).map(a => a.textContent),
      releases: $$('.sp-wrap', doc).map(this.createShowRelease.bind(this)).filter((r): r is PSAShowRelease => !!r),
      thumbnail: ($('.entry-inner > a', doc) as HTMLAnchorElement).href 
    };
  }

  private serializePSAMovie(doc: Document): PSAMovie {

    return {
      name: $('.post-title', doc).textContent,
      categories: $$('.category a', doc).map(a => a.textContent),
      thumbnail: ($('.entry-inner > a', doc) as HTMLAnchorElement).href,
      content: '',
      releases: []
    };
  }

  getMediaByCategory(category: PSACategory, page = 0): Observable<PSAMedium[]> {

    const uri = `https://${this.PSA_DOMAIN}/category/${category}/${page > 0 ? `page/${page + 1}/` : ''}`;

    return this.getPSADocument(uri).pipe(
      map(doc => {
        return this.serializePSAMedia(doc);
      })
    );
  }

  getShowById(showId: string): Observable<PSAShow> {

    const uri = `https://${this.PSA_DOMAIN}?p=${showId}`;

    return this.getPSADocument(uri).pipe(
      map(doc => {
        return this.serializePSAShow(doc);
      })
    );
  }

  getMovieById(movieId: string): Observable<PSAMovie> {

    const uri = `https://${this.PSA_DOMAIN}?p=${movieId}`;

    return this.getPSADocument(uri).pipe(
      map(doc => {
        return this.serializePSAMovie(doc);
      })
    );
  }

  getContentByFullLink(fullLink: string): Observable<PSAMovie | PSAShow> {

    return this.getPSADocument(fullLink).pipe(
      map(doc => {

        if (fullLink.includes('/tv-show/')) {
          return this.serializePSAShow(doc);
        }
        if (fullLink.includes('/movie/')) {
          return this.serializePSAMovie(doc);
        }
        
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    return this.http.get(`../../assets/dataFallback/${error.url.replace(/\?|:|\//g, '_')}.html`, { responseType: 'text' });
  }

}