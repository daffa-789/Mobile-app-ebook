// Test: QRIS payload builder
import { describe, it, expect } from 'vitest';

function buildQrisRef(orderId, amount) {
  return `WAH-${orderId}-${amount}-${Date.now().toString(36)}`;
}

describe('buildQrisRef', () => {
  it('starts with WAH prefix', () => {
    expect(buildQrisRef('001', 50000)).toMatch(/^WAH-/);
  });
  it('contains order id', () => {
    expect(buildQrisRef('ABC123', 50000)).toContain('ABC123');
  });
  it('contains amount', () => {
    expect(buildQrisRef('001', 75000)).toContain('75000');
  });
});
