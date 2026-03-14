/**
 * GET /api/wallet/balances
 * 查询用户所有钱包余额
 */

import type { APIRoute } from 'astro';
import { getAllWalletBalances } from '@/lib/services/wallet.service';
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

    // 获取钱包余额
    const balances = await getAllWalletBalances(user.id);

    return new Response(JSON.stringify(successResponse(balances)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Get wallet balances endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch wallet balances';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
