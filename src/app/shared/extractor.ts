/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable no-console */
import axios, { AxiosInstance } from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import { CookieJar, JSDOM } from 'jsdom';

import { PSAMovieRelease, PSAShowRelease } from '../model/PSARelease.interface';
import { serializeForm, btoa, delay, urljoin } from './utils';
import { StflyResult } from './model.interface';
import LOG from 'electron-log';

abstract class PSABaseExtractor {
	ax: AxiosInstance;
	cj: CookieJar;

	constructor() {
		this.cj = new CookieJar();
		this.ax = axios.create({
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15'
			},
			// proxy: {
			// 	host: '127.0.0.1',
			// 	port: 8888
			// },
			maxRedirects: 3
		});
		axiosCookieJarSupport(this.ax);
		this.ax.defaults.jar = true;
		this.ax.defaults.withCredentials = true;
	}

	async postForm(form: HTMLFormElement): Promise<DocumentFragment> {
		const { data } = await this.ax.post(form.action, serializeForm(form), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});

		return JSDOM.fragment(data);
	}

	abstract extract(
		release: PSAShowRelease | PSAMovieRelease
	): Promise<string | string[]>;
}

class PSAOUOIOExtractor extends PSABaseExtractor {
	private readonly OUO_PATTERN = /^https?:\/\/ouo\.(io|press)\//i;
	/**
	 * Known values for the `VstCnt` cookie that will redirect to an OUO site
	 */
	private ouoIndices: number[] = [4, 14, 15]; //[8, 9, 10, 15, 16, 21, 23]; // 4 und 14 müssen rein

	constructor() {
		super();
		const now = new Date();
		const utcToday = `${`00${now.getUTCDate()}`.slice(-2)}${`00${
			now.getUTCMonth() + 1
		}`.slice(-2)}${now.getUTCFullYear().toString().slice(-2)}`;

		this.cj.setCookieSync(
			`LstVstD=${encodeURIComponent(btoa(utcToday))}; path=/; secure`,
			'https://x265.club/'
		);
	}

	async getOUORedirect(link: string): Promise<string | undefined> {
		let i = 0;
		let result: string | undefined;
		do {
			this.cj.setCookieSync(
				`VstCnt=${btoa(this.ouoIndices[i])}; path=/; secure`,
				new URL(link).origin
			);

			LOG.info(`Trying ${this.ouoIndices[i]}`);

			const { data, headers } = await this.ax.get<string>(link, {
				jar: this.cj,
				maxRedirects: 0,
				validateStatus: (code) => code < 400
			});

			result = headers.location;

			if (!result) {
				const match = /action=(?<redirect>\S+)/.exec(data);
				result = match?.groups?.redirect;
				LOG.info(`No 301 redirect, recieved ${result ?? 'Nothing'}`);
			}
		} while (
			!result?.match(this.OUO_PATTERN) &&
			++i < this.ouoIndices.length
		);

		return result;
	}

	async try(link: string): Promise<string[]> {
		const maybeOuoLink = await this.getOUORedirect(link);
		if (!maybeOuoLink) return [];

		// 1. Go to OUO.IO
		const { data } = await this.ax.get(maybeOuoLink);
		let doc = JSDOM.fragment(data);

		// 2. Find the first form and POST it
		const formCaptcha = doc.querySelector<HTMLFormElement>('#form-captcha');
		if (!formCaptcha) {
			LOG.info('No captcha form!');
			return [];
		}
		doc = await this.postForm(formCaptcha);

		// 3. Find the second form and POST it
		const formGo = doc.querySelector<HTMLFormElement>('#form-go');
		if (!formGo) {
			LOG.info('No go form!');
			return [];
		}
		doc = await this.postForm(formGo);

		// 4. Get the links
		const links = Array.from(
			doc.querySelectorAll<HTMLAnchorElement>('.entry-content a'),
			(aTag) => aTag.href
		);
		return links;
	}

	updateIndices(newIndices: number[]): void {
		this.ouoIndices = [...newIndices];
	}

	getIndices(): number[] {
		return this.ouoIndices;
	}

	async extract(
		release: PSAShowRelease | PSAMovieRelease
	): Promise<string[]> {
		LOG.info(
			`Adding release ${release.name} with ${release.exitLinks.length} link(s)`
		);

		const results = [];

		for (const exitLink of release.exitLinks) {
			const result = await this.try(exitLink);

			if (result.length) {
				results.push(...result);
			}
		}
		return results;
	}
}

class PSAStFlyExtractor extends PSABaseExtractor {
	async extract(
		release: PSAShowRelease | PSAMovieRelease
	): Promise<string[]> {
		LOG.info(
			`Adding release ${release.name} with ${release.exitLinks.length} link(s)`
		);

		const results = [];

		for (const exitLink of release.exitLinks) {
			const result = await this.try(exitLink);

			if (result.length) {
				results.push(...result);
			}
		}
		return results;
	}

	async try(exitLink: string): Promise<string[]> {
		const { data } = await this.ax.get(exitLink);

		const uri = data.match(/action=(\S+)/)[1];
		const mainurl = new URL(uri);

		const origin = mainurl.origin;

		// bail if not stfly-like
		// also hier ne whitelist?

		// ########################################################################################
		// # 4. post stfly link
		// ########################################################################################
		const alias = mainurl.pathname.slice(1, 2);

		LOG.log(`POSTing to ${uri} with alias ${alias}...`);

		const { data: d1 } = await this.ax.post(`${uri}`, `alias=${alias}`, {
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				Referer: `${uri}?`,
				Origin: origin
			}
		});
		const soup1 = JSDOM.fragment(d1);
		const form1 = soup1.querySelector('form');

		if (!form1) {
			LOG.warn('No redirection form found!');
			return [];
		}

		const redirect = form1.action;
		const formData = serializeForm(form1);

		// ########################################################################################
		// # 5. post redirect-like
		// ########################################################################################
		const { data: d2 } = await this.ax.post(redirect, formData, {
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				Referer: `${origin}/`,
				Origin: origin
			}
		});
		const soup2 = JSDOM.fragment(d2);
		const form2 = soup2.querySelector<HTMLFormElement>('form#form');

		if (!form2) {
			LOG.warn('No captcha form found!');
			return [];
		}

		let captchaFormData = serializeForm(form2);
		captchaFormData += '&g-recaptcha-response=0';

		// ########################################################################################
		// # 6. post redirect-like captcha response
		// ########################################################################################
		const uri2 = new URL(redirect);
		const base = uri2.origin;

		const { data: d3 } = await this.ax.post(redirect, captchaFormData, {
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				Referer: redirect,
				Origin: base
			}
		});
		const soup3 = JSDOM.fragment(d3);
		const redirectElement = soup3.querySelector<HTMLAnchorElement>('#surl');

		if (!redirectElement) {
			LOG.warn('No redirect button found!');
			return [];
		}

		const newStflyLink = redirectElement.href;
		if (newStflyLink !== uri) {
			LOG.warn(
				'Stfly links are not matching! Could be error or the redirection logic changed?'
			);
		}

		// ########################################################################################
		// # 8. get stfly link (again)
		// ########################################################################################
		const uri3 = new URL(newStflyLink);
		const stflyBase = uri3.origin;

		const { data: d4 } = await this.ax.get(newStflyLink, {
			headers: {
				Referer: base
			}
		});
		const soup4 = JSDOM.fragment(d4);
		const form4 = soup4.querySelector<HTMLFormElement>('form#go-link');

		if (!form4) {
			LOG.warn('No stfly go form found!');
			return [];
		}

		const action = form4.action;
		const targetLink = urljoin(stflyBase, action);
		const finalFormData = serializeForm(form4);

		// ########################################################################################
		// # 9. post stfly links/go
		// ########################################################################################

		LOG.log('Waiting...');
		await delay(5);

		const { data: d5 } = await this.ax.post<StflyResult>(
			targetLink,
			finalFormData,
			{
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					Origin: stflyBase,
					Referer: newStflyLink,
					Accept: 'application/json, text/javascript, */*; q=0.01',
					'X-Requested-With': 'XMLHttpRequest'
				}
			}
		);

		if (!('status' in d5)) {
			LOG.error(d5.message);
			return [];
		}

		const finalLink = d5.url;

		// ########################################################################################
		// # 10. get from get-to.link
		// ########################################################################################

		const { data: d6 } = await this.ax.get(finalLink, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36',
				Cookie:
					'cf_clearance=a86e15bc51f14e4ff1b0f2fbff0d1fefcd853044-1626637224-0-250'
			}
		});
		const soup6 = JSDOM.fragment(d6);

		const links = Array.from(
			soup6.querySelectorAll<HTMLAnchorElement>('.entry-content a'),
			(aTag) => aTag.href
		);

		if (links.length < 2) {
			LOG.error('Failed to get links');
			return [];
		}

		return links;
	}
}

export const ouoioExtractor = new PSAOUOIOExtractor();
export const stflyExtractor = new PSAStFlyExtractor();
