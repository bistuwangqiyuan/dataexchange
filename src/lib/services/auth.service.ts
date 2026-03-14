/**
 * Auth Service
 *
 * 使用 Neon 数据库 + JWT 的自定义认证（替代 Supabase Auth）
 */

import { getDb } from '@/lib/db/neon';
import { signToken, verifyToken, getExpiresAt } from '@/lib/auth/jwt';
import { logger } from '@/lib/utils/logger';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api.types';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** 从请求头解析 Bearer token */
export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

/** 当前用户（与 Supabase User 兼容的字段子集，供 API 使用） */
export interface CurrentUser {
  id: string;
  email: string;
}

/**
 * 从请求中获取当前用户（校验 JWT）
 */
export async function getCurrentUser(request?: Request): Promise<CurrentUser | null> {
  const token = request ? getTokenFromRequest(request) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  return { id: payload.sub, email: payload.email };
}

/**
 * 验证用户已登录，否则抛错
 */
export async function requireAuth(request?: Request): Promise<CurrentUser> {
  const user = await getCurrentUser(request);
  if (!user) throw new Error('Unauthorized: Please login');
  return user;
}

/**
 * 用户注册
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const sql = getDb();
  logger.info('Registering new user', { email: data.email });

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const email = data.email.trim().toLowerCase();

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }

  const inserted = await sql`
    INSERT INTO users (email, password_hash, is_verified)
    VALUES (${email}, ${passwordHash}, true)
    RETURNING id, email, is_verified
  `;
  const row = inserted[0] as { id: string; email: string; is_verified: boolean };
  if (!row) throw new Error('Registration failed');

  const accessToken = signToken({ userId: row.id, email: row.email });
  logger.info('User registered successfully', { userId: row.id });

  return {
    user: { id: row.id, email: row.email, is_verified: row.is_verified },
    session: {
      access_token: accessToken,
      refresh_token: accessToken,
      expires_at: getExpiresAt(),
    },
  };
}

/**
 * 用户登录
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const sql = getDb();
  logger.info('User login attempt', { email: data.email });

  const email = data.email.trim().toLowerCase();
  const users = await sql`
    SELECT id, email, password_hash, is_verified
    FROM users
    WHERE email = ${email}
  `;
  const row = users[0] as { id: string; email: string; password_hash: string; is_verified: boolean } | undefined;
  if (!row || !row.password_hash) {
    throw new Error('Invalid email or password');
  }
  const ok = await bcrypt.compare(data.password, row.password_hash);
  if (!ok) throw new Error('Invalid email or password');

  await sql`
    UPDATE users
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = ${row.id}
  `;

  const accessToken = signToken({ userId: row.id, email: row.email });
  logger.info('User logged in successfully', { userId: row.id });

  return {
    user: { id: row.id, email: row.email, is_verified: row.is_verified },
    session: {
      access_token: accessToken,
      refresh_token: accessToken,
      expires_at: getExpiresAt(),
    },
  };
}

/**
 * 用户登出（客户端清除 token 即可，服务端无状态）
 */
export async function logoutUser(): Promise<void> {
  logger.info('User logged out (client-side token clear)');
}
