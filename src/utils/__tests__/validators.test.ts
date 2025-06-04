
import { validateCpf, calculateResidentialAdjustedAmount } from '../validators';

describe('validateCpf', () => {
  it('should validate correct CPFs', () => {
    expect(validateCpf('11144477735')).toBe(true);
    expect(validateCpf('111.444.777-35')).toBe(true);
  });

  it('should reject invalid CPFs', () => {
    expect(validateCpf('11111111111')).toBe(false);
    expect(validateCpf('12345678901')).toBe(false);
    expect(validateCpf('123')).toBe(false);
    expect(validateCpf('')).toBe(false);
  });

  it('should handle CPFs with formatting', () => {
    expect(validateCpf('111.444.777-35')).toBe(true);
    expect(validateCpf('111-444-777.35')).toBe(true);
  });
});

describe('calculateResidentialAdjustedAmount', () => {
  it('should apply 20% discount for residential', () => {
    expect(calculateResidentialAdjustedAmount(100, true)).toBe(80);
    expect(calculateResidentialAdjustedAmount(250, true)).toBe(200);
  });

  it('should not apply discount for non-residential', () => {
    expect(calculateResidentialAdjustedAmount(100, false)).toBe(100);
    expect(calculateResidentialAdjustedAmount(250, false)).toBe(250);
  });

  it('should handle decimal amounts', () => {
    expect(calculateResidentialAdjustedAmount(150.50, true)).toBe(120.4);
    expect(calculateResidentialAdjustedAmount(150.50, false)).toBe(150.50);
  });
});
