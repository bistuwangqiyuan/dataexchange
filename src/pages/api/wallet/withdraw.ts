/**
 * POST /api/wallet/withdraw
 * 申请提现
 */

import type { APIRoute } from 'astro';
import { withdrawFunds } from '@/lib/services/wallet.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { getCurrentUser } from '@/lib/services/auth.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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
    const { currency, amount, address } = body;

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

    // 处理提现
    await withdrawFunds(user.id, { currency, amount, address });

    logger.info('Withdrawal processed via API', { userId: user.id, currency, amount });

    return new Response(
      JSON.stringify(successResponse({ message: 'Withdrawal successful', currency, amount })),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Withdrawal endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to process withdrawal';

    // 判断错误类型
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let statusCode = 500;

    if (message.includes('Insufficient balance')) {
      errorCode = ErrorCode.INSUFFICIENT_BALANCE;
      statusCode = 400;
    } else if (message.includes('Invalid currency')) {
      errorCode = ErrorCode.INVALID_INPUT;
      statusCode = 400;
    } else if (message.includes('Wallet not found')) {
      errorCode = ErrorCode.INVALID_INPUT;
      statusCode = 404;
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
