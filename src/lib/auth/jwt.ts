/**
 * JWT 签发与校验（用于 Neon 自定义认证）
 */

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    { sub: payload.userId, email: payload.email },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getExpiresAt(): number {
  const d = new Date();
  if (EXPIRES_IN.endsWith('d')) {
    d.setDate(d.getDate() + parseInt(EXPIRES_IN, 10));
  } else {
    d.setHours(d.getHours() + 24);
  }
  return Math.floor(d.getTime() / 1000);
}
