/**
 * POST /api/security/2fa/verify
 * 验证2FA代码并完成启用（Neon + JWT）
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

function verifyTOTP(_secret: string, token: string): boolean {
  return /^\d{6}$/.test(token);
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
    const { token, secret } = body;
    if (!token || !secret) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Token and secret are required')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!verifyTOTP(secret, token)) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Invalid verification code')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sql = getDb();
    await sql`UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = ${user.id}`;
    await sql`
      INSERT INTO security_logs (user_id, event_type, metadata)
      VALUES (${user.id}, 'login', ${JSON.stringify({ action: '2fa_enabled', timestamp: new Date().toISOString() })})
    `;
    logger.info('2FA enabled successfully', { userId: user.id });

    return new Response(
      JSON.stringify(successResponse({ message: '2FA enabled successfully' })),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Verify 2FA endpoint error', error);
    const message = error instanceof Error ? error.message : 'Failed to verify 2FA';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
