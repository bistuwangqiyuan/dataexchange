/**
 * POST /api/auth/refresh
 * 刷新访问令牌
 */

import type { APIRoute } from 'astro';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Refresh token is required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createServerClient();

    // 使用 refresh token 获取新的 session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      logger.error('Token refresh failed', error);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Invalid or expired refresh token')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.info('Token refreshed successfully', { userId: data.user?.id });

    return new Response(
      JSON.stringify(
        successResponse({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.user!.id,
            email: data.user!.email!,
          },
        })
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logger.error('Refresh token endpoint error', error);

    const message = error instanceof Error ? error.message : 'Token refresh failed';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

