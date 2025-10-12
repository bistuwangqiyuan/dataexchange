/**
 * Auth Service Tests
 * 测试认证服务
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, loginUser, logoutUser, getCurrentUser } from '@/lib/services/auth.service';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
    })),
  })),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser()', () => {
    it('should register a new user successfully', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const signUpMock = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            confirmed_at: null,
          },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { signUp: signUpMock },
      });

      const result = await registerUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.session.access_token).toBe('token-123');
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    it('should throw error on registration failure', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const signUpMock = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' },
      });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { signUp: signUpMock },
      });

      await expect(
        registerUser({
          email: 'existing@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('loginUser()', () => {
    it('should login user successfully', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const signInMock = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { signInWithPassword: signInMock },
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      });

      const result = await loginUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.session.access_token).toBe('token-123');
    });

    it('should throw error on invalid credentials', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const signInMock = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { signInWithPassword: signInMock },
      });

      await expect(
        loginUser({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logoutUser()', () => {
    it('should logout user successfully', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const signOutMock = vi.fn().mockResolvedValue({ error: null });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { signOut: signOutMock },
      });

      await expect(logoutUser()).resolves.not.toThrow();
      expect(signOutMock).toHaveBeenCalled();
    });

    it('should throw error on logout failure', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const signOutMock = vi.fn().mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { signOut: signOutMock },
      });

      await expect(logoutUser()).rejects.toThrow('Logout failed');
    });
  });

  describe('getCurrentUser()', () => {
    it('should return current user', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const getUserMock = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { getUser: getUserMock },
      });

      const user = await getCurrentUser();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when not authenticated', async () => {
      const mockSupabase = await import('@/lib/supabase/client');
      const getUserMock = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      (mockSupabase.createServerClient as any).mockReturnValue({
        auth: { getUser: getUserMock },
      });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });
});

