/**
 * GET /api/market/:pair
 * 获取指定交易对行情
 */

import type { APIRoute } from 'astro';
import { getMarketTicker } from '@/lib/services/market.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { pair } = params;
    
    if (!pair) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Trading pair is required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // URL 编码处理（BTC-USDT -> BTC/USDT）
    const tradingPair = pair.replace('-', '/').toUpperCase();
    
    const ticker = await getMarketTicker(tradingPair);

    return new Response(JSON.stringify(successResponse(ticker)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=10',
      },
    });
  } catch (error) {
    logger.error('Get ticker endpoint error', error);
    
    const message = error instanceof Error ? error.message : 'Failed to fetch market ticker';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INVALID_TRADING_PAIR, message)),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

