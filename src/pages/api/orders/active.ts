/**
 * GET /api/orders/active
 * 查询当前委托订单（pending状态）
 */

import type { APIRoute } from 'astro';
import { getActiveOrders } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { getCurrentUser } from '@/lib/services/auth.service';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
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

    // 获取活跃订单
    const orders = await getActiveOrders(user.id);

    return new Response(JSON.stringify(successResponse(orders)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache', // 订单状态应该实时查询
      },
    });
  } catch (error) {
    logger.error('Get active orders endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch active orders';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

