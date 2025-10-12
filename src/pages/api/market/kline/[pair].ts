/**
 * GET /api/market/kline/[pair]
 * 获取K线数据（蜡烛图）
 * 支持参数: interval (1m, 5m, 15m, 1h, 4h, 1d), limit (default: 100)
 */

import type { APIRoute } from 'astro';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

const BINANCE_API = 'https://api.binance.com/api/v3';

// 交易对映射
const BINANCE_SYMBOLS: Record<string, string> = {
  'BTC/USDT': 'BTCUSDT',
  'ETH/USDT': 'ETHUSDT',
  'BNB/USDT': 'BNBUSDT',
  'XRP/USDT': 'XRPUSDT',
  'ADA/USDT': 'ADAUSDT',
  'DOGE/USDT': 'DOGEUSDT',
  'SOL/USDT': 'SOLUSDT',
  'DOT/USDT': 'DOTUSDT',
};

// 时间间隔映射
const VALID_INTERVALS = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];

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
    const binanceSymbol = BINANCE_SYMBOLS[tradingPair];

    if (!binanceSymbol) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_TRADING_PAIR, `Unsupported trading pair: ${tradingPair}`)),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 获取查询参数
    const interval = url.searchParams.get('interval') || '1h';
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // 验证间隔
    if (!VALID_INTERVALS.includes(interval)) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, `Invalid interval. Allowed: ${VALID_INTERVALS.join(', ')}`)),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 验证限制
    if (limit < 1 || limit > 1000) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Limit must be between 1 and 1000')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    logger.debug('Fetching K-line data from Binance', { tradingPair, binanceSymbol, interval, limit });

    // 调用 Binance API
    const response = await fetch(
      `${BINANCE_API}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const rawData = await response.json();

    // 转换 Binance K线数据格式
    // Binance 返回: [openTime, open, high, low, close, volume, closeTime, ...]
    const klines = rawData.map((item: any[]) => ({
      timestamp: item[0], // 开盘时间
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: item[5],
      close_time: item[6],
      quote_volume: item[7],
      trades: item[8],
    }));

    return new Response(
      JSON.stringify(
        successResponse({
          trading_pair: tradingPair,
          interval,
          klines,
        })
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Reason: K线数据缓存策略 - 根据时间间隔设置不同的缓存时间
          'Cache-Control': interval === '1m' ? 'public, max-age=10' : interval === '1h' ? 'public, max-age=300' : 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    logger.error('Get K-line endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch K-line data';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

