/**
 * GET /api/transactions
 * 获取用户的所有成交记录
 * 支持分页和筛选
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
    const tradingPair = url.searchParams.get('trading_pair');
    const type = url.searchParams.get('type'); // 'buy' or 'sell'

    // 构建查询
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // 应用筛选
    if (tradingPair) {
      query = query.eq('trading_pair', tradingPair);
    }

    if (type && (type === 'buy' || type === 'sell')) {
      query = query.eq('type', type);
    }

    // 应用分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: transactions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logger.error('Failed to fetch transactions', error);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch transactions')),
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
          items: transactions || [],
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

