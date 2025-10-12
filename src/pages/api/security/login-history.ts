/**
 * GET /api/security/login-history
 * 获取用户的登录历史
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Please login first')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createServerClient();

    // 获取查询参数
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('page_size') || '20'), 100);

    // 查询登录相关的安全日志
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: logs, error, count } = await supabase
      .from('security_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .in('event_type', ['login', 'logout', 'failed_login'])
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logger.error('Failed to fetch login history', error);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch login history')),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return new Response(
      JSON.stringify(
        successResponse({
          items: logs || [],
          pagination: {
            page,
            page_size: pageSize,
            total: count || 0,
            total_pages: totalPages,
          },
        })
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    logger.error('Get login history endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch login history';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

