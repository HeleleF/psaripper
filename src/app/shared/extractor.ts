/* eslint-disable no-console */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import { CookieJar, JSDOM } from 'jsdom';

import { PSAMovieRelease, PSAShowRelease } from '../model/PSARelease.interface';
import { serializeForm, btoa, delay, urljoin } from './utils';
import { BaseResponse, ErrorResponse, StflyResult } from './model.interface';
import LOG from 'electron-log';

export function handleAxiosError(error: AxiosError): ErrorResponse {
	if (error.response) {
		// The request was made and the server responded with a status code
		// that falls out of the range of 2xx
		LOG.error(`Recieved HTTP ${error.response.status}`);
		LOG.verbose(error.response.data);
		LOG.verbose(error.response.headers);
	} else if (error.request) {
		// The request was made but no response was received
		// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
		// http.ClientRequest in node.js
		LOG.error('Request made without getting a response!');
		LOG.verbose(error.request);
	} else {
		// Something happened in setting up the request that triggered an Error
		LOG.error(`Unknown error: ${error.message}`);
	}

	const { url, data, headers, jar } = error.config;
	LOG.verbose(
		`##########################################################################`
	);
	LOG.verbose(`Request was to ${url} with ${data}`);
	LOG.verbose('\tHeaders:', headers);
	LOG.verbose('\tCookies:', jar);
	LOG.verbose(
		`##########################################################################`
	);

	return { response: null, err: true };
}

abstract class PSABaseExtractor {
	protected ax: AxiosInstance;
	protected cj: CookieJar;

	constructor() {
		this.cj = new CookieJar();
		this.ax = axios.create({
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
				Cookie:
					'cf_clearance=7479a3bb03f1d85b87cac17ff6f1d2bc666ca8b0-1627141513-0-150'
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

	updateSettings(settings: any) {
		LOG.info('now using', settings);

		if (settings.cfCookie) {
			LOG.info('update cookie');
			this.ax.defaults.headers[
				'Cookie'
			] = `cf_clearance=${settings.cfCookie}`;
		}
	}

	async doGetRequest(
		url: string,
		config?: AxiosRequestConfig
	): Promise<BaseResponse<string>> {
		LOG.verbose(`GETting ${url} with config: ${config}`);

		try {
			const { data } = await this.ax.get(url, config);
			return { response: data, err: false };
		} catch (error) {
			return handleAxiosError(error);
		}
	}

	async doPostRequest(
		url: string,
		postData: any,
		config?: AxiosRequestConfig
	): Promise<BaseResponse<string>> {
		LOG.verbose(`POSTing to ${url} with data: ${postData}`);

		try {
			const { data } = await this.ax.post(url, postData, config);
			return { response: data, err: false };
		} catch (error) {
			return handleAxiosError(error);
		}
	}

	async postForm(form: HTMLFormElement): Promise<DocumentFragment> {
		const url = form.action;
		const data = serializeForm(form);
		const config = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		};

		const { response, err } = await this.doPostRequest(url, data, config);

		if (err) {
			return JSDOM.fragment('');
		}

		return JSDOM.fragment(response!);
	}

	abstract extractOne(link: string): Promise<string[]>;

	async extract(
		release: PSAShowRelease | PSAMovieRelease
	): Promise<string[]> {
		LOG.info(
			`Adding release ${release.name} with ${release.exitLinks.length} link(s)`
		);

		const results = [];

		for (const exitLink of release.exitLinks) {
			const result = await this.extractOne(exitLink);

			if (result.length) {
				results.push(...result);
			}
		}
		return results;
	}

	getFinalLinks(doc: DocumentFragment): string[] {
		const links = Array.from(
			doc.querySelectorAll<HTMLAnchorElement>('.entry-content a'),
			(aTag) => aTag.href
		);

		if (links.length < 2) {
			LOG.error('Failed to get links');
			return [];
		}

		return links;
	}
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

	async extractOne(link: string): Promise<string[]> {
		const maybeOuoLink = await this.getOUORedirect(link);
		if (!maybeOuoLink) return [];

		// 1. Go to OUO.IO
		const { response, err } = await this.doGetRequest(maybeOuoLink);
		if (err) return [];

		let doc = JSDOM.fragment(response!);

		// 2. Find the first form and POST it
		const formCaptcha = doc.querySelector<HTMLFormElement>('#form-captcha');
		if (!formCaptcha) {
			LOG.error('No captcha form found!');
			return [];
		}
		doc = await this.postForm(formCaptcha);

		// 3. Find the second form and POST it
		const formGo = doc.querySelector<HTMLFormElement>('#form-go');
		if (!formGo) {
			LOG.error('No go form found!');
			return [];
		}
		doc = await this.postForm(formGo);

		// 4. Get the links
		return this.getFinalLinks(doc);
	}

	updateIndices(newIndices: number[]): void {
		this.ouoIndices = [...newIndices];
	}

	getIndices(): number[] {
		return this.ouoIndices;
	}

	updateSettings(cfg: any) {
		super.updateSettings(cfg);

		if (cfg.ouoIndices) {
			this.updateIndices(cfg.ouoIndices);
		}
	}
}

class PSAStFlyExtractor extends PSABaseExtractor {
	async extractOne(exitLink: string): Promise<string[]> {
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

		const { data: d6 } = await this.ax.get(finalLink);
		const soup6 = JSDOM.fragment(d6);

		return this.getFinalLinks(soup6);
	}
}

export const ouoioExtractor = new PSAOUOIOExtractor();
export const stflyExtractor = new PSAStFlyExtractor();
