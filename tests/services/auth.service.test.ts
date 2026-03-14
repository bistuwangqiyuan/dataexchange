/**
 * Auth Service Tests (Neon + JWT)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, loginUser, logoutUser, getCurrentUser } from '@/lib/services/auth.service';

const mockSql = vi.fn();
vi.mock('@/lib/db/neon', () => ({
  getDb: () => mockSql,
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password: string) => Promise.resolve(`hashed:${password}`)),
    compare: vi.fn((plain: string, hashed: string) => Promise.resolve(hashed === `hashed:${plain}`)),
  },
}));

vi.mock('@/lib/auth/jwt', () => ({
  signToken: vi.fn(() => 'mock-jwt-token'),
  verifyToken: vi.fn((token: string) =>
    token === 'valid-token' ? { sub: 'user-123', email: 'test@example.com' } : null
  ),
  getExpiresAt: vi.fn(() => Math.floor(Date.now() / 1000) + 3600),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser()', () => {
    it('should register a new user successfully', async () => {
      mockSql.mockResolvedValueOnce([]).mockResolvedValueOnce([
        { id: 'user-123', email: 'test@example.com', is_verified: true },
      ]);

      const result = await registerUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.session.access_token).toBe('mock-jwt-token');
      expect(mockSql).toHaveBeenCalled();
    });

    it('should throw error on registration failure', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'existing' }]);

      await expect(
        registerUser({
          email: 'existing@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('loginUser()', () => {
    it('should login user successfully', async () => {
      mockSql
        .mockResolvedValueOnce([
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed:Password123',
            is_verified: true,
          },
        ])
        .mockResolvedValueOnce(undefined);

      const result = await loginUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.session.access_token).toBe('mock-jwt-token');
    });

    it('should throw error on invalid credentials', async () => {
      mockSql.mockResolvedValueOnce([]);

      await expect(
        loginUser({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logoutUser()', () => {
    it('should logout user successfully', async () => {
      await expect(logoutUser()).resolves.not.toThrow();
    });

    it('should not throw on logout', async () => {
      await expect(logoutUser()).resolves.toBeUndefined();
    });
  });

  describe('getCurrentUser()', () => {
    it('should return current user when valid token in request', async () => {
      const request = new Request('http://test', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      const user = await getCurrentUser(request);
      expect(user?.email).toBe('test@example.com');
      expect(user?.id).toBe('user-123');
    });

    it('should return null when not authenticated', async () => {
      const request = new Request('http://test');
      const user = await getCurrentUser(request);
      expect(user).toBeNull();
    });
  });
});
