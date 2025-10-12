/**
 * Market Service
 * 
 * 处理市场行情数据
 * 数据源：CoinGecko API + Binance API
 */

import { logger } from '@/lib/utils/logger';
import { decimal, calculatePriceChange, formatCurrency } from '@/lib/utils/decimal';
import type { MarketTicker, OrderBook, Trade } from '@/types/api.types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const BINANCE_API = 'https://api.binance.com/api/v3';

// 币种ID映射（CoinGecko）
const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SOL: 'solana',
  DOT: 'polkadot',
};

// 交易对映射（Binance）
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

/**
 * 获取市场行情（使用 CoinGecko）
 */
export async function getMarketTicker(tradingPair: string): Promise<MarketTicker> {
  const [base] = tradingPair.split('/');
  const coinId = COIN_IDS[base];

  if (!coinId) {
    throw new Error(`Unsupported trading pair: ${tradingPair}`);
  }

  logger.debug('Fetching market ticker from CoinGecko', { tradingPair, coinId });

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const coinData = data[coinId];

    if (!coinData) {
      throw new Error('No data returned from CoinGecko');
    }

    // 计算24h高低价（模拟，基于当前价格和涨跌幅）
    const currentPrice = decimal(coinData.usd);
    const change24h = decimal(coinData.usd_24h_change || 0).div(100);
    const high24h = currentPrice.times(decimal(1).plus(change24h.abs()));
    const low24h = currentPrice.times(decimal(1).minus(change24h.abs()));

    return {
      trading_pair: tradingPair,
      price: formatCurrency(currentPrice, 2),
      volume_24h: formatCurrency(coinData.usd_24h_vol || 0, 2),
      change_24h: formatCurrency(change24h, 4),
      high_24h: formatCurrency(high24h, 2),
      low_24h: formatCurrency(low24h, 2),
      last_updated: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to fetch market ticker', error);
    throw new Error('Failed to retrieve market data');
  }
}

/**
 * 获取所有支持的交易对行情
 */
export async function getAllMarketTickers(): Promise<MarketTicker[]> {
  const tradingPairs = Object.keys(BINANCE_SYMBOLS);
  const tickers = await Promise.all(
    tradingPairs.map(pair => getMarketTicker(pair).catch(error => {
      logger.warn(`Failed to get ticker for ${pair}`, error);
      return null;
    }))
  );

  return tickers.filter((t): t is MarketTicker => t !== null);
}

/**
 * 获取订单簿（使用 Binance）
 */
export async function getOrderBook(tradingPair: string, depth = 20): Promise<OrderBook> {
  const symbol = BINANCE_SYMBOLS[tradingPair];

  if (!symbol) {
    throw new Error(`Unsupported trading pair: ${tradingPair}`);
  }

  logger.debug('Fetching order book from Binance', { tradingPair, symbol });

  try {
    const response = await fetch(
      `${BINANCE_API}/depth?symbol=${symbol}&limit=${depth}`
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      trading_pair: tradingPair,
      bids: data.bids.slice(0, depth),
      asks: data.asks.slice(0, depth),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to fetch order book', error);
    throw new Error('Failed to retrieve order book');
  }
}

/**
 * 获取最近成交（使用 Binance）
 */
export async function getRecentTrades(tradingPair: string, limit = 50): Promise<Trade[]> {
  const symbol = BINANCE_SYMBOLS[tradingPair];

  if (!symbol) {
    throw new Error(`Unsupported trading pair: ${tradingPair}`);
  }

  logger.debug('Fetching recent trades from Binance', { tradingPair, symbol });

  try {
    const response = await fetch(
      `${BINANCE_API}/trades?symbol=${symbol}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((trade: any) => ({
      id: trade.id.toString(),
      trading_pair: tradingPair,
      price: formatCurrency(trade.price, 2),
      quantity: formatCurrency(trade.qty, 8),
      side: trade.isBuyerMaker ? 'sell' : 'buy',
      timestamp: new Date(trade.time).toISOString(),
    }));
  } catch (error) {
    logger.error('Failed to fetch recent trades', error);
    throw new Error('Failed to retrieve recent trades');
  }
}

/**
 * 获取支持的交易对列表
 */
export function getSupportedTradingPairs(): string[] {
  return Object.keys(BINANCE_SYMBOLS);
}

/**
 * 验证交易对是否支持
 */
export function isSupportedTradingPair(tradingPair: string): boolean {
  return tradingPair in BINANCE_SYMBOLS;
}

