/**
 * Order Service
 *
 * 使用 Neon 数据库处理订单创建、取消、查询
 */

import { getDb } from '@/lib/db/neon';
import { logger } from '@/lib/utils/logger';
import Decimal from 'decimal.js';
import { executeMarketOrder, freezeBalance } from './order-matching.service';
import type { CreateOrderRequest, OrderResponse } from '@/types/api.types';
import type { Order, OrderStatus } from '@/types/database.types';

/**
 * 创建订单
 */
export async function createOrder(
  userId: string,
  orderData: CreateOrderRequest
): Promise<OrderResponse> {
  const sql = getDb();
  logger.info('Creating order', { userId, orderData });

  if (!orderData.trading_pair.match(/^[A-Z]{2,10}\/[A-Z]{2,10}$/)) {
    throw new Error('Invalid trading pair format');
  }
  const quantity = new Decimal(orderData.quantity);
  if (quantity.lte(0)) throw new Error('Quantity must be greater than zero');
  if (orderData.order_type === 'limit' && !orderData.price) {
    throw new Error('Price is required for limit orders');
  }
  let price: Decimal | null = null;
  if (orderData.price) {
    price = new Decimal(orderData.price);
    if (price.lte(0)) throw new Error('Price must be greater than zero');
  }

  const [baseCurrency, quoteCurrency] = orderData.trading_pair.split('/');
  const priceRows = await sql`
    SELECT price FROM market_prices WHERE trading_pair = ${orderData.trading_pair} LIMIT 1
  `;
  const marketPriceRow = (priceRows as { price: string }[])[0];
  if (!marketPriceRow) throw new Error(`Market price not found for ${orderData.trading_pair}`);
  const marketPrice = new Decimal(marketPriceRow.price);
  const effectivePrice = orderData.order_type === 'market' ? marketPrice : price!;

  let requiredCurrency: string;
  let requiredAmount: Decimal;
  if (orderData.side === 'buy') {
    requiredCurrency = quoteCurrency;
    requiredAmount = effectivePrice.mul(quantity);
  } else {
    requiredCurrency = baseCurrency;
    requiredAmount = quantity;
  }

  const walletRows = await sql`
    SELECT balance, frozen FROM wallets
    WHERE user_id = ${userId} AND currency = ${requiredCurrency}
  `;
  const wallet = (walletRows as { balance: string; frozen: string }[])[0];
  if (!wallet) throw new Error(`Wallet not found for ${requiredCurrency}`);
  const available = new Decimal(wallet.balance).minus(wallet.frozen);
  if (available.lt(requiredAmount)) throw new Error('Insufficient balance');

  if (orderData.order_type === 'limit') {
    await freezeBalance(userId, requiredCurrency, requiredAmount.toString());
  }

  const orderPrice = orderData.order_type === 'market' ? null : effectivePrice.toString();
  const status: OrderStatus = orderData.order_type === 'market' ? 'pending' : 'pending';
  const insertRows = await sql`
    INSERT INTO orders (user_id, trading_pair, order_type, side, price, quantity, filled_quantity, status)
    VALUES (${userId}, ${orderData.trading_pair}, ${orderData.order_type}, ${orderData.side}, ${orderPrice}, ${quantity.toString()}, '0', ${status})
    RETURNING *
  `;
  const order = (insertRows as Order[])[0];
  if (!order) throw new Error('Failed to create order');

  if (orderData.order_type === 'market') {
    await executeMarketOrder(order);
  }

  logger.info('Order created successfully', { orderId: order.id });
  return mapOrderToResponse(order);
}

/**
 * 取消订单
 */
export async function cancelOrder(userId: string, orderId: string): Promise<void> {
  const sql = getDb();
  logger.info('Cancelling order', { userId, orderId });

  const orderRows = await sql`
    SELECT * FROM orders WHERE id = ${orderId} AND user_id = ${userId}
  `;
  const order = (orderRows as Order[])[0];
  if (!order) throw new Error('Order not found');
  if (order.status !== 'pending' && order.status !== 'partial') {
    throw new Error('Only pending orders can be cancelled');
  }

  const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');
  const quantity = new Decimal(order.quantity);
  const orderPrice = new Decimal(order.price ?? '0');
  let frozenCurrency: string;
  let frozenAmount: Decimal;
  if (order.side === 'buy') {
    frozenCurrency = quoteCurrency;
    frozenAmount = orderPrice.mul(quantity);
  } else {
    frozenCurrency = baseCurrency;
    frozenAmount = quantity;
  }

  const walletRows = await sql`
    SELECT frozen FROM wallets WHERE user_id = ${userId} AND currency = ${frozenCurrency}
  `;
  const w = (walletRows as { frozen: string }[])[0];
  if (w && new Decimal(w.frozen).gte(frozenAmount)) {
    await sql`
      UPDATE wallets
      SET frozen = frozen - ${frozenAmount.toString()}, updated_at = NOW()
      WHERE user_id = ${userId} AND currency = ${frozenCurrency}
    `;
  }
  await sql`
    UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ${orderId}
  `;
  logger.info('Order cancelled successfully', { orderId });
}

/**
 * 查询活跃订单
 */
export async function getActiveOrders(userId: string): Promise<OrderResponse[]> {
  const sql = getDb();
  const orders = await sql`
    SELECT * FROM orders
    WHERE user_id = ${userId} AND status = 'pending'
    ORDER BY created_at DESC
  `;
  return (orders as Order[]).map(mapOrderToResponse);
}

/**
 * 查询订单历史
 */
export async function getOrderHistory(
  userId: string,
  filters?: {
    trading_pair?: string;
    status?: OrderStatus;
    page?: number;
    page_size?: number;
  }
): Promise<{ orders: OrderResponse[]; total: number }> {
  const sql = getDb();
  const page = filters?.page ?? 1;
  const pageSize = filters?.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let countRows: { count: string }[];
  let orderRows: unknown[];
  if (filters?.trading_pair && filters?.status) {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM orders
      WHERE user_id = ${userId} AND trading_pair = ${filters.trading_pair} AND status = ${filters.status}
    ` as { count: string }[];
    orderRows = await sql`
      SELECT * FROM orders
      WHERE user_id = ${userId} AND trading_pair = ${filters.trading_pair} AND status = ${filters.status}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (filters?.trading_pair) {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM orders WHERE user_id = ${userId} AND trading_pair = ${filters.trading_pair}
    ` as { count: string }[];
    orderRows = await sql`
      SELECT * FROM orders
      WHERE user_id = ${userId} AND trading_pair = ${filters.trading_pair}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (filters?.status) {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM orders WHERE user_id = ${userId} AND status = ${filters.status}
    ` as { count: string }[];
    orderRows = await sql`
      SELECT * FROM orders
      WHERE user_id = ${userId} AND status = ${filters.status}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM orders WHERE user_id = ${userId}
    ` as { count: string }[];
    orderRows = await sql`
      SELECT * FROM orders WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  }
  const total = parseInt(countRows[0]?.count ?? '0', 10);
  return {
    orders: (orderRows as Order[]).map(mapOrderToResponse),
    total,
  };
}

function mapOrderToResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    user_id: order.user_id,
    trading_pair: order.trading_pair,
    order_type: order.order_type,
    side: order.side,
    price: order.price,
    quantity: order.quantity,
    filled_quantity: order.filled_quantity,
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}
