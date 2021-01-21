import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { JSDOM } from 'jsdom';

import { serializeForm, btoa } from './utils';

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla 5.0'
  },
  maxRedirects: 3
});
axiosCookieJarSupport(axiosInstance);
axiosInstance.defaults.jar = true;
axiosInstance.defaults.withCredentials = true;

const dp = new (new JSDOM().window.DOMParser)();

let lastIndex = 9;

async function extractOuoIo(ouoioLink: string): Promise<string[]> {

  console.time('ouo-load');

  const { data: ouoCaptcha1 } = await axiosInstance.get(ouoioLink);

  let doc = dp.parseFromString(ouoCaptcha1, 'text/html');
  const formCaptcha = doc.querySelector<HTMLFormElement>('#form-captcha');

  if (!formCaptcha) {
    console.log('No captcha form!');
    return [];
  }
  
  const { data: ouoCaptcha2 } = await axiosInstance.post(formCaptcha.action, serializeForm(formCaptcha), { 
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' } 
  });

  doc = dp.parseFromString(ouoCaptcha2, 'text/html');
  const formGo = doc.querySelector<HTMLFormElement>('#form-go');

  if (!formGo) {
    console.log('No go form!');
    return [];
  }

  const { data: resultData } = await axiosInstance.post(formGo.action, serializeForm(formGo), { 
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' } 
  });
  doc = dp.parseFromString(resultData, 'text/html');

  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('.entry-content a'), aTag => aTag.href);

  console.timeEnd('ouo-load');
  console.log(links);

  return links;
}

async function guess(releaseName: string): Promise<string[]> {

  const kebab = releaseName.toLowerCase().replace(/\./g, '-');

  try {

    const { data: resultData } = await axiosInstance.get(`https://get-to.link/${kebab}999`);

    const doc = dp.parseFromString(resultData, 'text/html');
  
    const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('.entry-content a'), aTag => aTag.href);

    if (links.length < 2) return [];
    return links;

  } catch (e) {
    return [];
  }
}

async function updateOuoIndex(exitLink: string, cookies: CookieJar): Promise<string> {

  const psaUrl = new URL(exitLink);

  const tries: Promise<string>[] = [];
  const source = axios.CancelToken.source();

  for (let idx = 1; idx < 20; idx++) {

    const prom = cookies.clone()
      .then(cj => cj.setCookie(`VstCnt=${Buffer.from(idx.toString()).toString('base64')}; path=/; secure`, psaUrl.origin).then(() => cj))
      .then(cj => axiosInstance.get<string>(exitLink, { cancelToken: source.token, jar: cj, maxRedirects: 0, validateStatus: code => code === 302 }))
      .then(({ headers }) => {

        lastIndex = idx;
        source.cancel('Index found!');
        console.log(`Index updated to ${lastIndex}`);

        return headers.location as string;
      });

    tries.push(prom);
  }

  try {
    return await (Promise as any).any(tries) as Promise<string>;
  } catch (_) {
    return ''; 
  }
}

async function getOuoRedirect(exitLink: string): Promise<string> {

  const psaUrl = new URL(exitLink);

  const now = new Date();
  const utcToday = `${`00${now.getUTCDay()}`.slice(-2)}${`00${now.getUTCMonth() + 1}`.slice(-2)}${now.getUTCFullYear().toString().slice(-2)}`;

  const cj = new CookieJar();
  await cj.setCookie(`LstVstD=${encodeURIComponent(btoa(utcToday))}; path=/; secure`, psaUrl.origin);
  await cj.setCookie(`VstCnt=${encodeURIComponent(btoa(lastIndex))}; path=/; secure`, psaUrl.origin);

  try {

    const { headers } = await axiosInstance.get(exitLink, { jar: cj, maxRedirects: 0, validateStatus: code => code === 302 });
    if (headers.location?.includes('ouo')) return headers.location;

  // eslint-disable-next-line no-empty
  } catch {}

  return updateOuoIndex(exitLink, cj);
}

export async function extract(exitLink: string, releaseName?: string): Promise<string[]> {

  console.log('Extracting...');

  if (releaseName) {
    const results = await guess(releaseName);
    if (results.length) return results;
  }

  console.log(`Get redirect with index ${lastIndex}...`);

  const redirect = await getOuoRedirect(exitLink);

  if (!redirect) return [];

  console.log('Extracting with ouo...');

  return extractOuoIo(redirect);
}
