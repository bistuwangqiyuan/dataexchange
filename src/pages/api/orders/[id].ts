/**
 * GET /api/orders/[id]
 * 获取订单详情
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
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

    const { id: orderId } = params;

    if (!orderId) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Order ID is required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const sql = getDb();
    const orderRows = await sql`
      SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${user.id}
    `;
    const order = (orderRows as Record<string, unknown>[])[0];
    if (!order) {
      logger.warn('Order not found or access denied', { orderId, userId: user.id });
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.ORDER_NOT_FOUND, 'Order not found')),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    const txRows = await sql`
      SELECT * FROM transactions WHERE order_id = ${orderId} ORDER BY created_at DESC
    `;
    return new Response(
      JSON.stringify(
        successResponse({
          order,
          transactions: (txRows as Record<string, unknown>[]) || [],
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
    logger.error('Get order detail endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch order details';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

