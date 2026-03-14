/**
 * POST /api/security/2fa/disable
 * 禁用双因素认证（Neon + JWT）
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

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
    const { password } = body;
    if (!password) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Password is required to disable 2FA')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sql = getDb();
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
    const row = (rows as { password_hash: string }[])[0];
    if (!row?.password_hash) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect password')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect password')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await sql`UPDATE users SET totp_secret = NULL, updated_at = NOW() WHERE id = ${user.id}`;
    await sql`
      INSERT INTO security_logs (user_id, event_type, metadata)
      VALUES (${user.id}, 'login', ${JSON.stringify({ action: '2fa_disabled', timestamp: new Date().toISOString() })})
    `;
    logger.info('2FA disabled', { userId: user.id });

    return new Response(
      JSON.stringify(successResponse({ message: '2FA disabled successfully' })),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Disable 2FA endpoint error', error);
    const message = error instanceof Error ? error.message : 'Failed to disable 2FA';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
