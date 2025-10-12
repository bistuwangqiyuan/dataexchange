/**
 * GET /api/orders/history
 * 获取用户订单历史
 */

import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/services/auth.service';
import { getUserOrders } from '@/lib/services/order.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    // 验证用户登录
    const user = await requireAuth();

    const tradingPair = url.searchParams.get('trading_pair') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const orders = await getUserOrders(user.id, tradingPair, limit);

    return new Response(JSON.stringify(successResponse(orders)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Get order history endpoint error', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
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

