/**
 * POST /api/wallet/deposit
 * 模拟充值
 */

import type { APIRoute } from 'astro';
import { depositFunds } from '@/lib/services/wallet.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { getCurrentUser } from '@/lib/services/auth.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // 验证用户登录
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

    // 解析请求体
    const body = await request.json();
    const { currency, amount } = body;

    // 验证必填字段
    if (!currency || !amount) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.REQUIRED_FIELD, 'Currency and amount are required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 处理充值
    await depositFunds(user.id, { currency, amount });

    logger.info('Deposit processed via API', { userId: user.id, currency, amount });

    return new Response(
      JSON.stringify(successResponse({ message: 'Deposit successful', currency, amount })),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Deposit endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to process deposit';

    // 判断错误类型
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let statusCode = 500;

    if (message.includes('Invalid currency')) {
      errorCode = ErrorCode.INVALID_INPUT;
      statusCode = 400;
    } else if (message.includes('amount')) {
      errorCode = ErrorCode.INVALID_INPUT;
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
