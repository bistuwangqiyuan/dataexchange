/**
 * GET /api/market/orderbook/:pair
 * 获取订单簿
 */

import type { APIRoute } from 'astro';
import { getOrderBook } from '@/lib/services/market.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
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
    
    // 深度参数（默认 20）
    const depth = parseInt(url.searchParams.get('depth') || '20', 10);
    
    const orderbook = await getOrderBook(tradingPair, depth);

    return new Response(JSON.stringify(successResponse(orderbook)), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5', // 缓存5秒
      },
    });
  } catch (error) {
    logger.error('Get orderbook endpoint error', error);
    
    const message = error instanceof Error ? error.message : 'Failed to fetch order book';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INVALID_TRADING_PAIR, message)),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

