/**
 * GET /api/transactions
 * 获取用户的所有成交记录
 * 支持分页和筛选
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
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const sql = getDb();
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('page_size') || '20'), 100);
    const tradingPair = url.searchParams.get('trading_pair');
    const type = url.searchParams.get('type');
    const offset = (page - 1) * pageSize;

    const countRows = tradingPair && type && (type === 'buy' || type === 'sell')
      ? await sql`
          SELECT COUNT(*)::text as c FROM transactions
          WHERE user_id = ${user.id} AND trading_pair = ${tradingPair} AND type = ${type}
        `
      : tradingPair
        ? await sql`
            SELECT COUNT(*)::text as c FROM transactions
            WHERE user_id = ${user.id} AND trading_pair = ${tradingPair}
          `
        : type && (type === 'buy' || type === 'sell')
          ? await sql`
              SELECT COUNT(*)::text as c FROM transactions
              WHERE user_id = ${user.id} AND type = ${type}
            `
          : await sql`SELECT COUNT(*)::text as c FROM transactions WHERE user_id = ${user.id}`;

    let txRows: unknown[];
    if (tradingPair && (type === 'buy' || type === 'sell')) {
      txRows = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id} AND trading_pair = ${tradingPair} AND type = ${type}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else if (tradingPair) {
      txRows = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id} AND trading_pair = ${tradingPair}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else if (type === 'buy' || type === 'sell') {
      txRows = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id} AND type = ${type}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      txRows = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
    }
    const count = parseInt((countRows as { c: string }[])[0]?.c ?? '0', 10);
    const totalPages = Math.ceil(count / pageSize);

    return new Response(
      JSON.stringify(
        successResponse({
          items: (txRows as Record<string, unknown>[]) || [],
          pagination: {
            page,
            page_size: pageSize,
            total: count,
            total_pages: totalPages,
          },
        })
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (error) {
    logger.error('Get transactions endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

