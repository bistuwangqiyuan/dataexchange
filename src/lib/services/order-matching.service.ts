/**
 * Order Matching Service
 *
 * 使用 Neon 数据库，通过存储过程执行市价单/限价单
 */

import { getDb } from '@/lib/db/neon';
import { logger } from '@/lib/utils/logger';
import { decimal } from '@/lib/utils/decimal';
import { getMarketTicker } from './market.service';
import type { Order, Transaction } from '@/types/database.types';

const TRADING_FEE_RATE = 0.001;

/**
 * 执行市价单（立即成交）
 */
export async function executeMarketOrder(order: Order): Promise<Transaction> {
  const sql = getDb();
  try {
    logger.info('Executing market order', { orderId: order.id, tradingPair: order.trading_pair });
    const ticker = await getMarketTicker(order.trading_pair);
    const marketPrice = decimal(ticker.price);
    const quantity = decimal(order.quantity);
    const total = marketPrice.times(quantity);
    const fee = total.times(TRADING_FEE_RATE);
    const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');

    const rows = await sql`
      SELECT execute_market_order(
        ${order.id},
        ${order.user_id},
        ${order.trading_pair},
        ${order.side},
        ${marketPrice.toString()},
        ${quantity.toString()},
        ${fee.toString()},
        ${total.toString()},
        ${baseCurrency},
        ${quoteCurrency}
      ) as id
    `;
    const txId = (rows as { id: string }[])[0]?.id;
    if (!txId) throw new Error('execute_market_order did not return transaction id');

    logger.info('Market order executed successfully', {
      orderId: order.id,
      price: marketPrice.toString(),
      quantity: quantity.toString(),
    });

    const txRows = await sql`
      SELECT * FROM transactions WHERE id = ${txId}
    `;
    return (txRows as Transaction[])[0];
  } catch (error) {
    logger.error('Market order execution error', error);
    throw error;
  }
}

/**
 * 检查并执行待成交的限价单
 */
export async function matchLimitOrders(): Promise<{ matched: number; failed: number }> {
  const sql = getDb();
  try {
    logger.info('Starting limit order matching process');
    const pendingOrders = await sql`
      SELECT * FROM orders
      WHERE status = 'pending' AND order_type = 'limit'
      ORDER BY created_at ASC
    ` as Order[];

    if (!pendingOrders?.length) {
      logger.info('No pending limit orders to match');
      return { matched: 0, failed: 0 };
    }
    logger.info(`Found ${pendingOrders.length} pending limit orders`);

    const tradingPairs = [...new Set(pendingOrders.map((o) => o.trading_pair))];
    const prices: Record<string, string> = {};
    for (const pair of tradingPairs) {
      try {
        const ticker = await getMarketTicker(pair);
        prices[pair] = ticker.price;
      } catch (err) {
        logger.error(`Failed to fetch price for ${pair}`, err);
      }
    }

    let matched = 0;
    let failed = 0;
    for (const order of pendingOrders) {
      try {
        const currentPrice = decimal(prices[order.trading_pair] ?? '0');
        const limitPrice = decimal(order.price ?? '0');
        const shouldExecute =
          order.side === 'buy' ? currentPrice.lte(limitPrice) : currentPrice.gte(limitPrice);
        if (shouldExecute) {
          await executeLimitOrder(order, currentPrice.toString());
          matched++;
        }
      } catch (err) {
        logger.error(`Failed to process limit order ${order.id}`, err);
        failed++;
      }
    }
    logger.info('Limit order matching completed', { matched, failed });
    return { matched, failed };
  } catch (error) {
    logger.error('Limit order matching process error', error);
    return { matched: 0, failed: 0 };
  }
}

async function executeLimitOrder(order: Order, executionPrice: string): Promise<void> {
  const sql = getDb();
  const quantity = decimal(order.quantity);
  const price = decimal(executionPrice);
  const total = price.times(quantity);
  const fee = total.times(TRADING_FEE_RATE);
  const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');

  await sql`
    SELECT execute_limit_order(
      ${order.id},
      ${order.user_id},
      ${order.trading_pair},
      ${order.side},
      ${executionPrice},
      ${quantity.toString()},
      ${fee.toString()},
      ${total.toString()},
      ${baseCurrency},
      ${quoteCurrency}
    )
  `;
  logger.info('Limit order executed', { orderId: order.id, price: executionPrice, quantity: quantity.toString() });
}

/**
 * 取消订单并解冻余额
 */
export async function cancelOrder(orderId: string, userId: string): Promise<void> {
  const sql = getDb();
  try {
    logger.info('Cancelling order', { orderId, userId });
    const orderRows = await sql`
      SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${userId}
    `;
    const order = (orderRows as Order[])[0];
    if (!order) throw new Error('Order not found');
    if (order.status !== 'pending' && order.status !== 'partial') {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }
    await sql`SELECT cancel_order(${orderId}, ${userId})`;
    await sql`
      INSERT INTO security_logs (user_id, event_type, metadata)
      VALUES (${userId}, 'order_cancelled', ${JSON.stringify({ order_id: orderId })})
    `;
    logger.info('Order cancelled successfully', { orderId });
  } catch (error) {
    logger.error('Cancel order error', error);
    throw error;
  }
}

/**
 * 冻结余额（下限价单时）
 */
export async function freezeBalance(
  userId: string,
  currency: string,
  amount: string
): Promise<void> {
  const sql = getDb();
  const rows = await sql`SELECT freeze_wallet_balance(${userId}, ${currency}, ${amount})`;
  if (!(rows as unknown[]).length) throw new Error('Failed to freeze balance');
  logger.info('Balance frozen', { userId, currency, amount });
}

/**
 * 解冻余额（取消订单时）
 */
export async function unfreezeBalance(
  userId: string,
  currency: string,
  amount: string
): Promise<void> {
  const sql = getDb();
  await sql`SELECT unfreeze_wallet_balance(${userId}, ${currency}, ${amount})`;
  logger.info('Balance unfrozen', { userId, currency, amount });
}
