/**
 * Returns true if the given URL uses a safe protocol (http, https, mailto, relative).
 * Blocks javascript:, data:, and vbscript: protocols to prevent XSS.
 */
export function isSafeUrl(url: string): boolean {
  return !(/^(javascript|data|vbscript):/i.test(url));
}
