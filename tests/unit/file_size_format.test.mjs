// Test: file size formatting
import { describe, it, expect } from 'vitest';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500.0 B');
  });
  it('formats KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });
  it('formats MB', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });
  it('formats zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});
