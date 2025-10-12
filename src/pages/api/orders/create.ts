/**
 * POST /api/orders/create
 * 创建订单（市价单或限价单）
 */

import type { APIRoute } from 'astro';
import { createOrder } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { getCurrentUser } from '@/lib/services/auth.service';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 验证用户登录
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

    // 解析请求体
    const body = await request.json();
    const { trading_pair, order_type, side, price, quantity } = body;

    // 验证必填字段
    if (!trading_pair || !order_type || !side || !quantity) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.REQUIRED_FIELD, 'Missing required fields')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 验证订单类型
    if (!['market', 'limit'].includes(order_type)) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Invalid order type')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 验证订单方向
    if (!['buy', 'sell'].includes(side)) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Invalid order side')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 限价单必须提供价格
    if (order_type === 'limit' && !price) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.REQUIRED_FIELD, 'Price is required for limit orders')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 创建订单
    const order = await createOrder(user.id, {
      trading_pair,
      order_type,
      side,
      price,
      quantity,
    });

    logger.info('Order created via API', { userId: user.id, orderId: order.id });

    return new Response(JSON.stringify(successResponse(order)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Create order endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to create order';

    // 判断错误类型
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let statusCode = 500;

    if (message.includes('Insufficient balance')) {
      errorCode = ErrorCode.INSUFFICIENT_BALANCE;
      statusCode = 400;
    } else if (message.includes('Invalid')) {
      errorCode = ErrorCode.INVALID_INPUT;
      statusCode = 400;
    } else if (message.includes('not found')) {
      errorCode = ErrorCode.INVALID_TRADING_PAIR;
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
