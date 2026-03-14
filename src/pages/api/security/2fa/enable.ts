/**
 * POST /api/security/2fa/enable
 * 启用双因素认证（Neon + JWT）
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
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

    const sql = getDb();
    const secret = generateTOTPSecret();
    const appName = 'CryptoExchange';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;

    await sql`
      UPDATE users SET totp_secret = ${secret}, updated_at = NOW() WHERE id = ${user.id}
    `;
    logger.info('2FA setup initiated', { userId: user.id });

    return new Response(
      JSON.stringify(
        successResponse({
          secret,
          qr_code_url: otpauthUrl,
          manual_entry_key: secret,
          message: 'Scan the QR code with your authenticator app, then verify with a code to complete setup',
        })
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Enable 2FA endpoint error', error);
    const message = error instanceof Error ? error.message : 'Failed to enable 2FA';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
