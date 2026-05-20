import { isSafeUrl } from './sanitize-url.util';

describe('isSafeUrl', () => {
  it('allows http URLs', () => expect(isSafeUrl('http://example.com')).toBe(true));
  it('allows https URLs', () => expect(isSafeUrl('https://example.com')).toBe(true));
  it('allows relative URLs', () => expect(isSafeUrl('/path/to/page')).toBe(true));
  it('allows mailto URLs', () => expect(isSafeUrl('mailto:user@example.com')).toBe(true));
  it('blocks javascript:', () => expect(isSafeUrl('javascript:alert(1)')).toBe(false));
  it('blocks data: URLs', () => expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false));
  it('blocks vbscript:', () => expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false));
  it('is case-insensitive', () => expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false));
});
