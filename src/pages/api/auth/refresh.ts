/**
 * POST /api/auth/refresh
 * 使用 JWT 刷新访问令牌（验证当前 token 后签发新 token）
 */

import type { APIRoute } from 'astro';
import { getTokenFromRequest } from '@/lib/services/auth.service';
import { verifyToken, signToken, getExpiresAt } from '@/lib/auth/jwt';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    let token = getTokenFromRequest(request);
    if (!token) {
      try {
        const body = await request.clone().json();
        token = body?.refresh_token ?? body?.access_token;
      } catch {
        /* no body */
      }
    }
    if (!token) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Refresh token or Authorization required')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Invalid or expired refresh token')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = signToken({ userId: payload.sub, email: payload.email });
    logger.info('Token refreshed successfully', { userId: payload.sub });

    return new Response(
      JSON.stringify(
        successResponse({
          access_token: accessToken,
          refresh_token: accessToken,
          expires_at: getExpiresAt(),
          user: { id: payload.sub, email: payload.email },
        })
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Refresh token endpoint error', error);
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
