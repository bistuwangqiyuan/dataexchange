/**
 * GET /api/security/login-history
 * 获取用户的登录历史（Neon）
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Please login first')),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sql = getDb();
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('page_size') || '20'), 100);
    const offset = (page - 1) * pageSize;

    const countRows = await sql`
      SELECT COUNT(*)::text as c FROM security_logs
      WHERE user_id = ${user.id} AND event_type IN ('login', 'logout', 'failed_login')
    `;
    const count = parseInt((countRows as { c: string }[])[0]?.c ?? '0', 10);
    const logs = await sql`
      SELECT * FROM security_logs
      WHERE user_id = ${user.id} AND event_type IN ('login', 'logout', 'failed_login')
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const totalPages = Math.ceil(count / pageSize);

    return new Response(
      JSON.stringify(
        successResponse({
          items: (logs as Record<string, unknown>[]) || [],
          pagination: { page, page_size: pageSize, total: count, total_pages: totalPages },
        })
      ),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=60' } }
    );
  } catch (error) {
    logger.error('Get login history endpoint error', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch login history';
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
