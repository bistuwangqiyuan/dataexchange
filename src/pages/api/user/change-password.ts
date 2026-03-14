/**
 * POST /api/user/change-password
 * 修改登录密码（Neon + JWT）
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { changePasswordSchema } from '@/lib/utils/validation';

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
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, validation.error.errors[0].message)),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { old_password, new_password } = validation.data;
    const sql = getDb();
    const rows = await sql`
      SELECT password_hash FROM users WHERE id = ${user.id}
    `;
    const row = (rows as { password_hash: string }[])[0];
    if (!row?.password_hash) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect old password')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const ok = await bcrypt.compare(old_password, row.password_hash);
    if (!ok) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect old password')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    await sql`
      UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${user.id}
    `;
    await sql`
      INSERT INTO security_logs (user_id, event_type, metadata)
      VALUES (${user.id}, 'password_change', ${JSON.stringify({ timestamp: new Date().toISOString() })})
    `;
    logger.info('Password changed successfully', { userId: user.id });

    return new Response(
      JSON.stringify(successResponse({ message: 'Password changed successfully' })),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Change password endpoint error', error);
    const message = error instanceof Error ? error.message : 'Failed to change password';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
