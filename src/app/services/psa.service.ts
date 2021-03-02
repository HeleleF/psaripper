/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { $, $$ } from '../shared/utils';

import { PSAMedium } from '../model/PSAMedium.interface';
import { PSAShow } from '../model/PSAShow.interface';
import { PSAMovie } from '../model/PSAMovie.interface';
import { PSACategory } from '../model/PSACategory.enum';
import { PSAShowRelease, PSAMovieRelease } from '../model/PSARelease.interface';

interface PSAMediumCache {
  [key: string]: PSAMedium[];
}

@Injectable({
  providedIn: 'root'
})
export class PsaService {

  private PSA_DOMAIN = 'psa.one';
  private dp: DOMParser;

  private readonly PSA_CACHE_KEY = 'psa_service_key';

  private readonly PSA_RELEASE_SIZE_PATTERN = /(?<size>(?:\d+|\d+\.\d+)) (?<byte>MB|GB)/;
  private readonly PSA_RELEASE_NUM_PATTERN = /\.S(?<season>\d{2})E(?<episode>\d{2})\./;
  private CACHE: PSAMediumCache;

  constructor(
    private http: HttpClient
  ) {

    this.dp = new DOMParser();

    const maybeCached = localStorage.getItem(this.PSA_CACHE_KEY);
    this.CACHE = maybeCached ? JSON.parse(maybeCached) : {};
  }

  private getPSADocument(uri: string) {
    return this.http.get(uri, { responseType: 'text' })
      .pipe(
        catchError(this.handleError.bind(this)),
        map(html => this.dp.parseFromString(html, 'text/html'))
      );
  }

  private serializePSAMedia(doc: Document): (PSAMedium | null)[] {
    return Array.from({ ...doc.querySelectorAll('article'), length: 14 }, (maybeArticle: HTMLDivElement | undefined) => {

      if (!maybeArticle) return null;

      return {
        id: maybeArticle.id.slice(5),
        name: maybeArticle.querySelector('.post-title > a')?.textContent ?? 'No name found!',
        thumbnail: maybeArticle.querySelector<HTMLImageElement>('.post-thumbnail > a > img')?.src ?? 'No thumbnail found!',
        fullLink: maybeArticle.querySelector<HTMLAnchorElement>('.post-thumbnail > a')?.href ?? 'No link found!',
        caption: maybeArticle.querySelector('.caption')?.textContent ?? 'No caption found!',
        excerpt: maybeArticle.querySelector('.excerpt > p')?.textContent ?? 'No excerpt found!',
        categories: [ ...maybeArticle.querySelectorAll('.post-category > a') ].map(a => a.textContent ?? '')
      };

    });
  }

  private getReleaseSize(elm: HTMLElement): number {

    const txt = $('p > strong > span', elm)?.nextSibling;
    if (!txt) return 0;

    const { groups } = this.PSA_RELEASE_SIZE_PATTERN.exec(txt.textContent ?? '') ?? {};
    if (!groups) return 0;

    return groups.byte === 'MB' ? parseFloat(groups.size) : parseFloat(groups.size) * 1000;
  }

  private getShowReleaseSource(elm: HTMLElement): string {

    const p = $('p:not([class]) > span > strong', elm)?.parentElement;
    return p?.nextSibling?.textContent?.slice(2) ?? 'None';
  }

  private hasShowReleaseSubs(elm: HTMLElement): boolean {

    const p = $('.sp-body > p:last-of-type', elm)?.previousElementSibling;

    if (!p || p.textContent?.includes('NONE')) return false;

    return true;
  }

  private getThumbnail(doc: Document): string {

    let thumb = $('.entry-inner > a', doc) as HTMLAnchorElement | null;
    if (!thumb) {
      thumb = $('.entry-inner > p > a', doc) as HTMLAnchorElement | null;
    }

    return thumb?.href ?? 'https://BROKEN.LINK';
  }

  private getShowReleaseNum(name: string) {

    const { groups } = this.PSA_RELEASE_NUM_PATTERN.exec(name) ?? {};

    return {
      season: parseInt(groups?.season ?? '99'),
      episode: parseInt(groups?.episode ?? '99')
    };
  }

  private createShowRelease(elm: HTMLElement): PSAShowRelease | null {

    const name = $('.sp-head', elm)?.textContent?.trim();

    // dont include release with strike-through names
    if (!name || /[\u0337\u0336\u0335]/.test(name)) return null;

    const { season, episode } = this.getShowReleaseNum(name);

    return {
      name,
      sizeMB: this.getReleaseSize(elm),
      exitLinks: [ ($('strong > a', elm) as HTMLAnchorElement).href ],
      source: this.getShowReleaseSource(elm),
      hasSubtitles: this.hasShowReleaseSubs(elm),
      season,
      episode
    };
  }

  private getMovieReleaseInfo(elm: HTMLElement) {

    const txt = elm.textContent;
    if (!txt) return { sizeMB: 0, source: 'None', hasSubtitles: false };

    const match = /Source : (?<src>\S*)/.exec(txt);
    const { groups } = /File size : (?<size>(?:\d+|\d+\.\d+)) (?<byte>MB|GB)/.exec(txt) ?? {};

    return {
      sizeMB: groups ? groups.byte === 'MB' ? parseFloat(groups.size) : parseFloat(groups.size) * 1000 : 0,
      source: match?.groups?.src ?? 'None',
      hasSubtitles: /\sText\s/.test(txt)
    };
  }

  private getMovieExitLinks(elm: HTMLElement): string[] {

    const anchors = elm.querySelectorAll('a');

    return [...anchors]
      .filter(anchor => anchor.textContent?.startsWith('Download'))
      .map(anchor => anchor.href);
  }

  private createMovieRelease(elm: HTMLElement): PSAMovieRelease | null {

    const name = elm.textContent?.trim();
    const info = elm.parentElement?.nextElementSibling;

    // dont include release with strike-through names 
    // TODO(helene): does this even happen with movies?
    if (!info?.nextElementSibling || !name || /[\u0335-\u0337]/.test(name)) return null;

    const { sizeMB, source, hasSubtitles } = this.getMovieReleaseInfo(info as HTMLElement);

    return {
      name,
      sizeMB,
      source,
      hasSubtitles,
      exitLinks: this.getMovieExitLinks(info.nextElementSibling as HTMLElement),
    };
  }

  private extractContent(root: Element | Document): string {

    let start = $('.entry-inner p', root) as Element | null;

    while (!start?.textContent?.trim().length) {
      start = start?.nextElementSibling ?? null;
    }

    return start?.textContent ?? 'No description';
  }

  private serializePSAShow(doc: Document): PSAShow {

    return {
      name: $('.post-title', doc)?.textContent ?? 'No show name?',   
      categories: $$('.category a', doc).map(a => a.textContent ?? ''),
      content: this.extractContent(doc),
      thumbnail: this.getThumbnail(doc),
      releases: $$('.sp-wrap', doc)
        .map(this.createShowRelease.bind(this))
        .filter((r): r is PSAShowRelease => !!r)
        .sort(({season: xs, episode: xe}, {season: ys, episode: ye}) => ys - xs === 0 ? ye - xe : ys - xs) 
    };
  }

  private serializePSAMovie(doc: Document): PSAMovie {

    return {
      name: $('.post-title', doc)?.textContent ?? 'No movie name?',
      categories: $$('.category a', doc).map(a => a.textContent ?? ''),
      thumbnail: this.getThumbnail(doc),
      content: this.extractContent(doc),
      releases: $$('.entry-inner > hr + p > strong', doc)
        .map(this.createMovieRelease.bind(this))
        .filter((r): r is PSAMovieRelease => !!r)
    };
  }

  getMediaByCategory(category: PSACategory, page = 0): Observable<PSAMedium[]> {

    const cacheKey = `${category}-${page}`;
    if (this.CACHE[cacheKey]) return of(this.CACHE[cacheKey]);

    const uri = `https://${this.PSA_DOMAIN}/category/${category}/${page > 0 ? `page/${page + 1}/` : ''}`;
    //const uri = `../../assets/dataFallback/page${page}.html`;

    return this.getPSADocument(uri).pipe(
      map(doc => this.serializePSAMedia(doc).filter((maybeMedium): maybeMedium is PSAMedium => !!maybeMedium)),
      tap(media => {
        this.CACHE[cacheKey] = media;
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

        return this.serializePSAMovie(doc);     
      })
    );
  }

  updatePSADomain(): Observable<string> {
    return this.getPSADocument(`https://${this.PSA_DOMAIN}/psarips-active-domains-and-mirrors/`).pipe(
      map(doc => {

        const pTag = $('.entry p:nth-child(4)', doc);
        if (!pTag) return this.PSA_DOMAIN;

        const strongTag = $('strong', pTag);
        const aTag = $('a', pTag) as HTMLAnchorElement | null;

        if (strongTag?.textContent?.includes('Active') && aTag?.textContent?.startsWith('https://')) {
          return aTag.href.slice(8).toLowerCase();
        }

        return this.PSA_DOMAIN;
      }),
      tap(maybeNewDomain => {

        if (maybeNewDomain !== this.PSA_DOMAIN) {
          this.PSA_DOMAIN = maybeNewDomain;
          console.log(`Updated psa domain to ${maybeNewDomain}`);
        }
      })
    );
  }

  deleteCache(): void {
    this.CACHE = {};
    localStorage.removeItem(this.PSA_CACHE_KEY);
  }

  saveCache(): void {
    localStorage.setItem(this.PSA_CACHE_KEY, JSON.stringify(this.CACHE));
  }

  private handleError(error: HttpErrorResponse) {

    if (error.status === 503) {
      return throwError('Blocked by wordfence :(');
    } else {
      return this.http.get(`../../assets/dataFallback/${error.url?.replace(/\?|:|\//g, '_') ?? ''}.html`, { responseType: 'text' });
    }
  }

}