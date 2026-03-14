/**
 * POST /api/auth/reset-password
 * 密码重置（Neon 版：仅返回提示，不发送邮件）
 */

import type { APIRoute } from 'astro';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body?.email;
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Email is required')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    logger.info('Password reset requested', { email });
    return new Response(
      JSON.stringify(
        successResponse({
          message: 'If the email exists, a password reset link has been sent. (Demo: no email sent)',
        })
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Reset password endpoint error', error);
    const message = error instanceof Error ? error.message : 'Password reset failed';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
