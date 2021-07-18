/**
 * Alias for `querySelector()`
 */
export function $(sel: string, doc: Document | Element): HTMLElement | null {
	return doc.querySelector(sel);
}

/**
 * Alias for `querySelectorAll()`, but returns **Array** of Elements, **not** a NodeList

 */
export function $$(sel: string, doc: Document | Element): HTMLElement[] {
	return [...doc.querySelectorAll(sel)] as HTMLElement[];
}

export function serializeForm(form: HTMLFormElement): string {
	return Array.from(
		form.querySelectorAll('input'),
		(i) => `${i.name}=${encodeURIComponent(i.value)}`
	).join('&');
}

export function delay(timeInSec: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, timeInSec * 1000));
}

// https://stackoverflow.com/a/49966753
export function urljoin(baseURL: string, relativeURL?: string): string {
	return relativeURL
		? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
		: baseURL;
}

export function btoa(data: string | number): string {
	return (
		globalThis?.btoa?.(data.toString()) ??
		Buffer.from(data.toString()).toString('base64')
	);
}
