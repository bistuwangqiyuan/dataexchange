/**
 * POST /api/orders/create
 * 创建订单
 */

import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/services/auth.service';
import { createOrder } from '@/lib/services/order.service';
import { createOrderSchema } from '@/lib/utils/validation';
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // 验证用户登录
    const user = await requireAuth();

    const body = await request.json();
    
    // 验证请求数据
    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      validation.error.errors.forEach(err => {
        const key = err.path.join('.');
        if (!errors[key]) errors[key] = [];
        errors[key].push(err.message);
      });
      return new Response(JSON.stringify(validationErrorResponse(errors)), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const order = await createOrder(user.id, validation.data);

    return new Response(JSON.stringify(successResponse(order)), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Create order endpoint error', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (error instanceof Error && error.message.includes('Insufficient balance')) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INSUFFICIENT_BALANCE, error.message)),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const message = error instanceof Error ? error.message : 'Failed to create order';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

