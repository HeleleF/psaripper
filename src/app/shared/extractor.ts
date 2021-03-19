/* eslint-disable no-console */
import axios, { AxiosInstance } from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import { CookieJar, JSDOM } from 'jsdom';

import { PSAMovieRelease, PSAShowRelease } from '../model/PSARelease.interface';
import { serializeForm, btoa } from './utils';

class PSAExtractor {
	private ax: AxiosInstance;
	private cj: CookieJar;

	private readonly OUO_PATTERN = /^https?:\/\/ouo\.(io|press)\//i;
	/**
	 * Known values for the `VstCnt` cookie that will redirect to an OUO site
	 */
	private ouoIndices: number[] = [9, 10, 15, 16, 21];

	constructor() {
		const now = new Date();
		const utcToday = `${`00${now.getUTCDay()}`.slice(-2)}${`00${
			now.getUTCMonth() + 1
		}`.slice(-2)}${now.getUTCFullYear().toString().slice(-2)}`;

		this.cj = new CookieJar();
		this.cj.setCookieSync(
			`LstVstD=${encodeURIComponent(btoa(utcToday))}; path=/; secure`,
			'https://psa.one/'
		);

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

	async getOUORedirect(link: string): Promise<string | undefined> {
		let i = 0;
		let result: string | undefined;
		do {
			this.cj.setCookieSync(
				`VstCnt=${btoa(this.ouoIndices[i])}; path=/; secure`,
				new URL(link).origin
			);

			console.log(`Trying ${this.ouoIndices[i]}`);

			const { headers } = await this.ax.get(link, {
				jar: this.cj,
				maxRedirects: 0,
				validateStatus: (code) => code < 400
			});

			result = headers.location;
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
			console.log('No captcha form!');
			return [];
		}
		doc = await this.postForm(formCaptcha);

		// 3. Find the second form and POST it
		const formGo = doc.querySelector<HTMLFormElement>('#form-go');
		if (!formGo) {
			console.log('No go form!');
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

	async add(release: PSAShowRelease | PSAMovieRelease): Promise<string[]> {
		console.log(
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

export const extractor = new PSAExtractor();
