/**
 * POST /api/orders/cancel/:id
 * 取消订单
 */

import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/services/auth.service';
import { cancelOrder } from '@/lib/services/order.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  try {
    // 验证用户登录
    const user = await requireAuth();

    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Order ID is required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await cancelOrder(user.id, id);

    return new Response(JSON.stringify(successResponse({ message: 'Order cancelled successfully' })), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Cancel order endpoint error', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (error instanceof Error && error.message.includes('Order not found')) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.ORDER_NOT_FOUND, error.message)),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (error instanceof Error && error.message.includes('Cannot cancel')) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.CANNOT_CANCEL_ORDER, error.message)),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Failed to cancel order';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

