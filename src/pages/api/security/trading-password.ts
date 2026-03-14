/**
 * POST /api/security/trading-password
 * 设置或更新交易密码（Neon + JWT）
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

function validateTradingPassword(password: string): boolean {
  return /^\d{6}$/.test(password);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Please login first')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { trading_password, login_password } = body;
    if (!trading_password || !validateTradingPassword(trading_password)) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Trading password must be 6 digits')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!login_password) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Login password is required')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sql = getDb();
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
    const row = (rows as { password_hash: string }[])[0];
    if (!row?.password_hash) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect login password')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const ok = await bcrypt.compare(login_password, row.password_hash);
    if (!ok) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect login password')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tradingHash = await bcrypt.hash(trading_password, 10);
    await sql`
      UPDATE users SET trading_password_hash = ${tradingHash}, updated_at = NOW() WHERE id = ${user.id}
    `;
    await sql`
      INSERT INTO security_logs (user_id, event_type, metadata)
      VALUES (${user.id}, 'password_change', ${JSON.stringify({ action: 'trading_password_set', timestamp: new Date().toISOString() })})
    `;
    logger.info('Trading password set', { userId: user.id });

    return new Response(
      JSON.stringify(successResponse({ message: 'Trading password set successfully' })),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Set trading password endpoint error', error);
    const message = error instanceof Error ? error.message : 'Failed to set trading password';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
