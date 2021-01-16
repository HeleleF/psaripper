/**
 * Alias for `querySelector()`
 * 
 * - defaults to `document.querySelector()`
 * - if `doc` is a *(HTML)Element*, it is used instead
 */
export function $(sel: string, doc: Document | Element = document): HTMLElement {
  return doc.querySelector(sel);
}

/**
 * Alias for `getElementById()`
 */
export const id = document.getElementById.bind(document);

/**
 * Alias for `querySelectorAll()`, but returns **Array** of Elements, **not** a NodeList
 * 
 * - defaults to `document.querySelectorAll()`
 * - if `doc` is a *(HTML)Element*, it is used instead
 */
export function $$(sel: string, doc: Document | Element = document): HTMLElement[] {
  return [...doc.querySelectorAll(sel)] as HTMLElement[];
}