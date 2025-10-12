/**
 * Decimal Utility Tests
 * 测试高精度金融计算
 */

import { describe, it, expect } from 'vitest';
import {
  decimal,
  formatCurrency,
  formatPercentage,
  calculateFee,
  calculateTotal,
  hasSufficientBalance,
  isValidAmount,
  isValidPrice,
  calculatePriceChange,
} from '@/lib/utils/decimal';

describe('Decimal Utilities', () => {
  describe('decimal()', () => {
    it('should create Decimal from number', () => {
      const d = decimal(100.5);
      expect(d.toString()).toBe('100.5');
    });

    it('should create Decimal from string', () => {
      const d = decimal('100.123456789');
      expect(d.toString()).toBe('100.123456789');
    });

    it('should handle very large numbers', () => {
      const d = decimal('999999999999999.999999999999999999');
      expect(d.toString()).toBe('999999999999999.999999999999999999');
    });
  });

  describe('formatCurrency()', () => {
    it('should format to 2 decimal places by default', () => {
      expect(formatCurrency('100.123456')).toBe('100.12');
    });

    it('should format to custom decimal places', () => {
      expect(formatCurrency('100.123456', 4)).toBe('100.1234');
    });

    it('should handle integers', () => {
      expect(formatCurrency('100')).toBe('100.00');
    });
  });

  describe('formatPercentage()', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercentage('0.1523')).toBe('15.23%');
    });

    it('should handle negative values', () => {
      expect(formatPercentage('-0.05')).toBe('-5.00%');
    });

    it('should format to custom decimal places', () => {
      expect(formatPercentage('0.123456', 4)).toBe('12.3456%');
    });
  });

  describe('calculateFee()', () => {
    it('should calculate trading fee correctly', () => {
      const fee = calculateFee('1000', '0.001');
      expect(fee.toString()).toBe('1');
    });

    it('should handle small amounts', () => {
      const fee = calculateFee('10', '0.001');
      expect(fee.toString()).toBe('0.01');
    });

    it('should handle zero fee rate', () => {
      const fee = calculateFee('1000', '0');
      expect(fee.toString()).toBe('0');
    });
  });

  describe('calculateTotal()', () => {
    it('should calculate order total correctly', () => {
      const total = calculateTotal('45000', '0.5');
      expect(total.toString()).toBe('22500');
    });

    it('should handle high precision', () => {
      const total = calculateTotal('45123.456', '0.123456');
      expect(total.toFixed(6)).toBe('5571.120790');
    });
  });

  describe('hasSufficientBalance()', () => {
    it('should return true when balance is sufficient', () => {
      expect(hasSufficientBalance('1000', '500')).toBe(true);
    });

    it('should return true when balance equals required', () => {
      expect(hasSufficientBalance('1000', '1000')).toBe(true);
    });

    it('should return false when balance is insufficient', () => {
      expect(hasSufficientBalance('500', '1000')).toBe(false);
    });

    it('should handle decimal amounts', () => {
      expect(hasSufficientBalance('100.123', '100.124')).toBe(false);
      expect(hasSufficientBalance('100.124', '100.123')).toBe(true);
    });
  });

  describe('isValidAmount()', () => {
    it('should accept positive amounts', () => {
      expect(isValidAmount('100')).toBe(true);
      expect(isValidAmount('0.01')).toBe(true);
    });

    it('should reject zero', () => {
      expect(isValidAmount('0')).toBe(false);
    });

    it('should reject negative amounts', () => {
      expect(isValidAmount('-100')).toBe(false);
    });

    it('should reject invalid strings', () => {
      expect(isValidAmount('abc')).toBe(false);
      expect(isValidAmount('')).toBe(false);
    });

    it('should reject infinity', () => {
      expect(isValidAmount(Infinity)).toBe(false);
    });
  });

  describe('isValidPrice()', () => {
    it('should accept positive prices', () => {
      expect(isValidPrice('45000')).toBe(true);
      expect(isValidPrice('0.01')).toBe(true);
    });

    it('should reject zero', () => {
      expect(isValidPrice('0')).toBe(false);
    });

    it('should reject negative prices', () => {
      expect(isValidPrice('-100')).toBe(false);
    });
  });

  describe('calculatePriceChange()', () => {
    it('should calculate positive price change', () => {
      const change = calculatePriceChange('110', '100');
      expect(change.toString()).toBe('0.1'); // 10% increase
    });

    it('should calculate negative price change', () => {
      const change = calculatePriceChange('90', '100');
      expect(change.toString()).toBe('-0.1'); // 10% decrease
    });

    it('should return 0 for no change', () => {
      const change = calculatePriceChange('100', '100');
      expect(change.toString()).toBe('0');
    });

    it('should return 0 when previous is zero', () => {
      const change = calculatePriceChange('100', '0');
      expect(change.toString()).toBe('0');
    });

    it('should handle high precision', () => {
      const change = calculatePriceChange('45123.456', '45000');
      expect(change.toFixed(6)).toBe('0.002743');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts', () => {
      const d = decimal('0.00000001');
      expect(d.toString()).toBe('0.00000001');
    });

    it('should maintain precision in calculations', () => {
      const result = decimal('0.1').plus('0.2');
      expect(result.toString()).toBe('0.3'); // No floating point error
    });

    it('should handle division precisely', () => {
      const result = decimal('10').div('3');
      expect(result.toFixed(6)).toBe('3.333333');
    });
  });
});

