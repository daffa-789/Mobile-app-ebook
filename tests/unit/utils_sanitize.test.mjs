// Test: HTML sanitization
import { describe, it, expect } from 'vitest';

function sanitizeHtml(html) {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/on\w+="[^"]*"/gi, '');
}

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    expect(sanitizeHtml('<p>hello</p><script>alert(1)</script>')).toBe('<p>hello</p>');
  });
  it('removes inline event handlers', () => {
    expect(sanitizeHtml('<div onclick="hack()">test</div>')).toBe('<div >test</div>');
  });
  it('preserves safe HTML', () => {
    expect(sanitizeHtml('<p>Wahidiyah</p>')).toBe('<p>Wahidiyah</p>');
  });
});
