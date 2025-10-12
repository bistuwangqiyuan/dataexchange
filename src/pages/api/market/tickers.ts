/**
 * GET /api/market/tickers
 * 获取所有交易对行情
 */

import type { APIRoute } from 'astro';
import { getAllMarketTickers } from '@/lib/services/market.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const tickers = await getAllMarketTickers();

    return new Response(JSON.stringify(successResponse(tickers)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10', // 缓存10秒
      },
    });
  } catch (error) {
    logger.error('Get tickers endpoint error', error);
    
    const message = error instanceof Error ? error.message : 'Failed to fetch market tickers';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

