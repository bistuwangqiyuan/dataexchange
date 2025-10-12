/**
 * GET /api/orders/[id]
 * 获取订单详情
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
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

    const supabase = createServerClient();

    // 获取订单详情（RLS自动确保用户只能访问自己的订单）
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      logger.warn('Order not found or access denied', { orderId, userId: user.id });
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.NOT_FOUND, 'Order not found')),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 获取该订单的所有成交记录
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (txError) {
      logger.error('Failed to fetch order transactions', txError);
      // 继续返回订单，即使成交记录查询失败
    }

    return new Response(
      JSON.stringify(
        successResponse({
          order,
          transactions: transactions || [],
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

