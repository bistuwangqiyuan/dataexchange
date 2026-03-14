/**
 * GET /api/orders/history
 * 查询订单历史
 * 
 * Query parameters:
 * - trading_pair: 交易对筛选（可选）
 * - status: 订单状态筛选（可选）
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 */

import type { APIRoute } from 'astro';
import { getOrderHistory } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import type { OrderStatus } from '@/types/database.types';
import { getCurrentUser } from '@/lib/services/auth.service';

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

    // 解析查询参数
    const trading_pair = url.searchParams.get('trading_pair') || undefined;
    const status = url.searchParams.get('status') as OrderStatus | undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const page_size = parseInt(url.searchParams.get('page_size') || '20');

    // 获取订单历史
    const result = await getOrderHistory(user.id, {
      trading_pair,
      status,
      page,
      page_size,
    });

    // 构造分页响应
    const response = {
      items: result.orders,
      total: result.total,
      page,
      page_size,
      total_pages: Math.ceil(result.total / page_size),
    };

    return new Response(JSON.stringify(successResponse(response)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Get order history endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch order history';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
