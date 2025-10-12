/**
 * Validation Utility Tests
 * 测试Zod数据验证
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  decimalSchema,
  tradingPairSchema,
  currencySchema,
  registerSchema,
  loginSchema,
  createOrderSchema,
  depositSchema,
  withdrawSchema,
  changePasswordSchema,
  uuidSchema,
} from '@/lib/utils/validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      expect(emailSchema.parse('user@example.com')).toBe('user@example.com');
      expect(emailSchema.parse('test.user+tag@domain.co.uk')).toBeTruthy();
    });

    it('should reject invalid emails', () => {
      expect(() => emailSchema.parse('invalid')).toThrow();
      expect(() => emailSchema.parse('user@')).toThrow();
      expect(() => emailSchema.parse('@domain.com')).toThrow();
      expect(() => emailSchema.parse('')).toThrow();
    });
  });

  describe('passwordSchema', () => {
    it('should accept strong passwords', () => {
      expect(passwordSchema.parse('Password123')).toBe('Password123');
      expect(passwordSchema.parse('SecurePass1')).toBeTruthy();
    });

    it('should reject weak passwords', () => {
      expect(() => passwordSchema.parse('short')).toThrow(/at least 8/);
      expect(() => passwordSchema.parse('nouppercase1')).toThrow(/uppercase/);
      expect(() => passwordSchema.parse('NOLOWERCASE1')).toThrow(/lowercase/);
      expect(() => passwordSchema.parse('NoNumbers')).toThrow(/number/);
    });
  });

  describe('decimalSchema', () => {
    it('should accept valid decimal numbers', () => {
      expect(decimalSchema.parse('100')).toBe('100');
      expect(decimalSchema.parse('100.50')).toBe('100.50');
      expect(decimalSchema.parse('0.001')).toBe('0.001');
    });

    it('should reject invalid decimals', () => {
      expect(() => decimalSchema.parse('0')).toThrow(/greater than 0/);
      expect(() => decimalSchema.parse('-100')).toThrow(/valid decimal/);
      expect(() => decimalSchema.parse('abc')).toThrow(/valid decimal/);
      expect(() => decimalSchema.parse('12.34.56')).toThrow();
    });
  });

  describe('tradingPairSchema', () => {
    it('should accept valid trading pairs', () => {
      expect(tradingPairSchema.parse('BTC/USDT')).toBe('BTC/USDT');
      expect(tradingPairSchema.parse('ETH/BTC')).toBe('ETH/BTC');
    });

    it('should reject invalid trading pairs', () => {
      expect(() => tradingPairSchema.parse('BTCUSDT')).toThrow(/Invalid trading pair/);
      expect(() => tradingPairSchema.parse('BTC-USDT')).toThrow();
      expect(() => tradingPairSchema.parse('btc/usdt')).toThrow(); // lowercase
    });
  });

  describe('currencySchema', () => {
    it('should accept valid currency codes', () => {
      expect(currencySchema.parse('BTC')).toBe('BTC');
      expect(currencySchema.parse('USDT')).toBe('USDT');
    });

    it('should reject invalid currency codes', () => {
      expect(() => currencySchema.parse('btc')).toThrow(/Invalid currency/); // lowercase
      expect(() => currencySchema.parse('B')).toThrow(/too short/);
      expect(() => currencySchema.parse('VERYLONGCODE')).toThrow(/too long/);
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const data = {
        email: 'user@example.com',
        password: 'SecurePass123',
      };
      expect(registerSchema.parse(data)).toEqual(data);
    });

    it('should reject invalid registration data', () => {
      expect(() =>
        registerSchema.parse({
          email: 'invalid-email',
          password: 'SecurePass123',
        })
      ).toThrow();

      expect(() =>
        registerSchema.parse({
          email: 'user@example.com',
          password: 'weak',
        })
      ).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'anypassword',
      };
      expect(loginSchema.parse(data)).toEqual(data);
    });

    it('should reject empty password', () => {
      expect(() =>
        loginSchema.parse({
          email: 'user@example.com',
          password: '',
        })
      ).toThrow();
    });
  });

  describe('createOrderSchema', () => {
    it('should accept valid market order', () => {
      const data = {
        trading_pair: 'BTC/USDT',
        order_type: 'market' as const,
        side: 'buy' as const,
        quantity: '0.5',
      };
      expect(createOrderSchema.parse(data)).toEqual(data);
    });

    it('should accept valid limit order with price', () => {
      const data = {
        trading_pair: 'BTC/USDT',
        order_type: 'limit' as const,
        side: 'sell' as const,
        price: '45000',
        quantity: '0.5',
      };
      expect(createOrderSchema.parse(data)).toEqual(data);
    });

    it('should reject limit order without price', () => {
      expect(() =>
        createOrderSchema.parse({
          trading_pair: 'BTC/USDT',
          order_type: 'limit',
          side: 'buy',
          quantity: '0.5',
        })
      ).toThrow(/Price is required for limit orders/);
    });

    it('should reject invalid order type', () => {
      expect(() =>
        createOrderSchema.parse({
          trading_pair: 'BTC/USDT',
          order_type: 'invalid',
          side: 'buy',
          quantity: '0.5',
        })
      ).toThrow();
    });
  });

  describe('depositSchema', () => {
    it('should accept valid deposit data', () => {
      const data = {
        currency: 'USDT',
        amount: '1000',
      };
      expect(depositSchema.parse(data)).toEqual(data);
    });

    it('should reject zero amount', () => {
      expect(() =>
        depositSchema.parse({
          currency: 'USDT',
          amount: '0',
        })
      ).toThrow();
    });
  });

  describe('withdrawSchema', () => {
    it('should accept valid withdrawal data', () => {
      const data = {
        currency: 'BTC',
        amount: '0.5',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };
      expect(withdrawSchema.parse(data)).toEqual(data);
    });

    it('should accept withdrawal without address (simulated)', () => {
      const data = {
        currency: 'USDT',
        amount: '100',
      };
      expect(withdrawSchema.parse(data)).toEqual(data);
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept valid password change data', () => {
      const data = {
        old_password: 'OldPass123',
        new_password: 'NewPass456',
      };
      expect(changePasswordSchema.parse(data)).toEqual(data);
    });

    it('should reject weak new password', () => {
      expect(() =>
        changePasswordSchema.parse({
          old_password: 'OldPass123',
          new_password: 'weak',
        })
      ).toThrow();
    });
  });

  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(uuidSchema.parse(uuid)).toBe(uuid);
    });

    it('should reject invalid UUIDs', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
      expect(() => uuidSchema.parse('12345678')).toThrow();
    });
  });
});

