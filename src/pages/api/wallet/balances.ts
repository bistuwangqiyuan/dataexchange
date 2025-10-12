/**
 * GET /api/wallet/balances
 * 获取用户所有钱包余额
 */

import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/services/auth.service';
import { getUserWallets } from '@/lib/services/wallet.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // 验证用户登录
    const user = await requireAuth();

    const wallets = await getUserWallets(user.id);

    return new Response(JSON.stringify(successResponse(wallets)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Get balances endpoint error', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new Response(JSON.stringify(unauthorizedResponse()), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const message = error instanceof Error ? error.message : 'Failed to fetch balances';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

