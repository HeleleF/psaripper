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
  return Array.from(form.querySelectorAll('input'), i => `${i.name}=${i.value}`).join('&');
}

export function btoa(data: string | number): string {
  return globalThis?.btoa?.(data.toString()) ?? Buffer.from(data.toString()).toString('base64');
}