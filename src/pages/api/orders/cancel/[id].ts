/**
 * POST /api/orders/cancel/:id
 * 取消订单
 */

import type { APIRoute } from 'astro';
import { cancelOrder } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { getCurrentUser } from '@/lib/services/auth.service';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
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

    const orderId = params.id;
    if (!orderId) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.REQUIRED_FIELD, 'Order ID is required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 取消订单
    await cancelOrder(user.id, orderId);

    logger.info('Order cancelled via API', { userId: user.id, orderId });

    return new Response(
      JSON.stringify(successResponse({ message: 'Order cancelled successfully' })),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Cancel order endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to cancel order';

    // 判断错误类型
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let statusCode = 500;

    if (message.includes('not found')) {
      errorCode = ErrorCode.ORDER_NOT_FOUND;
      statusCode = 404;
    } else if (message.includes('cannot be cancelled') || message.includes('Only pending')) {
      errorCode = ErrorCode.CANNOT_CANCEL_ORDER;
      statusCode = 400;
    }

    return new Response(
      JSON.stringify(errorResponse(errorCode, message)),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
