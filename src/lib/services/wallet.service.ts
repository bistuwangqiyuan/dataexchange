/**
 * Wallet Service
 *
 * 使用 Neon 数据库处理钱包余额、充值、提现等
 */

import { getDb } from '@/lib/db/neon';
import { logger } from '@/lib/utils/logger';
import Decimal from 'decimal.js';
import type { WalletBalance, DepositRequest, WithdrawRequest } from '@/types/api.types';

interface WalletRow {
  id: string;
  user_id: string;
  currency: string;
  balance: string;
  frozen: string;
}

/**
 * 获取用户所有钱包余额
 */
export async function getAllWalletBalances(userId: string): Promise<WalletBalance[]> {
  const sql = getDb();
  logger.info('Fetching wallet balances', { userId });

  const wallets = await sql`
    SELECT id, user_id, currency, balance, frozen
    FROM wallets
    WHERE user_id = ${userId}
    ORDER BY currency ASC
  `;

  if (!wallets || (wallets as WalletRow[]).length === 0) return [];

  return (wallets as WalletRow[]).map((w) => ({
    currency: w.currency,
    balance: w.balance,
    frozen: w.frozen,
    available: new Decimal(w.balance).minus(w.frozen).toString(),
  }));
}

/**
 * 获取指定币种余额
 */
export async function getWalletBalance(
  userId: string,
  currency: string
): Promise<WalletBalance | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, user_id, currency, balance, frozen
    FROM wallets
    WHERE user_id = ${userId} AND currency = ${currency}
  `;
  const wallet = (rows as WalletRow[])[0];
  if (!wallet) return null;
  return {
    currency: wallet.currency,
    balance: wallet.balance,
    frozen: wallet.frozen,
    available: new Decimal(wallet.balance).minus(wallet.frozen).toString(),
  };
}

/**
 * 模拟充值
 */
export async function depositFunds(
  userId: string,
  depositData: DepositRequest
): Promise<void> {
  const sql = getDb();
  logger.info('Processing deposit', { userId, depositData });

  const amount = new Decimal(depositData.amount);
  if (amount.lte(0)) throw new Error('Deposit amount must be greater than zero');

  const validCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL'];
  if (!validCurrencies.includes(depositData.currency)) throw new Error('Invalid currency');

  const wallets = await sql`
    SELECT id, balance FROM wallets
    WHERE user_id = ${userId} AND currency = ${depositData.currency}
  `;
  const wallet = (wallets as { id: string; balance: string }[])[0];

  if (wallet) {
    const newBalance = new Decimal(wallet.balance).plus(amount).toString();
    await sql`
      UPDATE wallets SET balance = ${newBalance}, updated_at = NOW()
      WHERE user_id = ${userId} AND currency = ${depositData.currency}
    `;
  } else {
    await sql`
      INSERT INTO wallets (user_id, currency, balance, frozen)
      VALUES (${userId}, ${depositData.currency}, ${amount.toString()}, '0')
    `;
  }

  const walletRows = await sql`SELECT id FROM wallets WHERE user_id = ${userId} AND currency = ${depositData.currency}`;
  const walletId = (walletRows as { id: string }[])[0]?.id;
  await sql`
    INSERT INTO wallet_transactions (wallet_id, user_id, type, currency, amount, status)
    VALUES (${walletId}, ${userId}, 'deposit', ${depositData.currency}, ${amount.toString()}, 'completed')
  `;
  logger.info('Deposit completed', { userId, amount: amount.toString(), currency: depositData.currency });
}

/**
 * 申请提现
 */
export async function withdrawFunds(
  userId: string,
  withdrawData: WithdrawRequest
): Promise<void> {
  const sql = getDb();
  logger.info('Processing withdrawal', { userId, withdrawData });

  const amount = new Decimal(withdrawData.amount);
  if (amount.lte(0)) throw new Error('Withdrawal amount must be greater than zero');
  const validCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL'];
  if (!validCurrencies.includes(withdrawData.currency)) throw new Error('Invalid currency');

  const wallets = await sql`
    SELECT id, balance, frozen FROM wallets
    WHERE user_id = ${userId} AND currency = ${withdrawData.currency}
  `;
  const wallet = (wallets as { id: string; balance: string; frozen: string }[])[0];
  if (!wallet) throw new Error('Wallet not found');
  const available = new Decimal(wallet.balance).minus(wallet.frozen);
  if (available.lt(amount)) throw new Error('Insufficient balance');

  const newBalance = new Decimal(wallet.balance).minus(amount).toString();
  await sql`
    UPDATE wallets SET balance = ${newBalance}, updated_at = NOW()
    WHERE user_id = ${userId} AND currency = ${withdrawData.currency}
  `;
  await sql`
    INSERT INTO wallet_transactions (wallet_id, user_id, type, currency, amount, status)
    VALUES (${wallet.id}, ${userId}, 'withdrawal', ${withdrawData.currency}, ${amount.toString()}, 'completed')
  `;
  logger.info('Withdrawal completed', { userId, amount: amount.toString(), currency: withdrawData.currency });
}

/**
 * 查询钱包交易历史
 */
export async function getWalletTransactions(
  userId: string,
  options?: {
    currency?: string;
    type?: 'deposit' | 'withdrawal';
    page?: number;
    page_size?: number;
  }
): Promise<{ transactions: Record<string, unknown>[]; total: number }> {
  const sql = getDb();
  const page = options?.page ?? 1;
  const pageSize = options?.page_size ?? 20;
  const offset = (page - 1) * pageSize;

  let countRows: { count: string }[];
  let txRows: unknown[];
  if (options?.currency && options?.type) {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM wallet_transactions
      WHERE user_id = ${userId} AND currency = ${options.currency} AND type = ${options.type}
    ` as { count: string }[];
    txRows = await sql`
      SELECT * FROM wallet_transactions
      WHERE user_id = ${userId} AND currency = ${options.currency} AND type = ${options.type}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (options?.currency) {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM wallet_transactions
      WHERE user_id = ${userId} AND currency = ${options.currency}
    ` as { count: string }[];
    txRows = await sql`
      SELECT * FROM wallet_transactions
      WHERE user_id = ${userId} AND currency = ${options.currency}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else if (options?.type) {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM wallet_transactions
      WHERE user_id = ${userId} AND type = ${options.type}
    ` as { count: string }[];
    txRows = await sql`
      SELECT * FROM wallet_transactions
      WHERE user_id = ${userId} AND type = ${options.type}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  } else {
    countRows = await sql`
      SELECT COUNT(*)::text as count FROM wallet_transactions WHERE user_id = ${userId}
    ` as { count: string }[];
    txRows = await sql`
      SELECT * FROM wallet_transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
  }
  const total = parseInt(countRows[0]?.count ?? '0', 10);
  return { transactions: txRows as Record<string, unknown>[], total };
}

/**
 * 计算总资产价值（以 USDT 计）
 */
export async function getTotalAssetValue(userId: string): Promise<string> {
  const sql = getDb();
  const wallets = await sql`
    SELECT currency, balance FROM wallets WHERE user_id = ${userId}
  `;
  if (!wallets || (wallets as { currency: string; balance: string }[]).length === 0) return '0';
  const prices = await sql`SELECT trading_pair, price FROM market_prices`;
  const priceMap = new Map(
    (prices as { trading_pair: string; price: string }[]).map((p) => [p.trading_pair, p.price])
  );
  let total = new Decimal(0);
  for (const w of wallets as { currency: string; balance: string }[]) {
    const balance = new Decimal(w.balance);
    if (w.currency === 'USDT') total = total.plus(balance);
    else {
      const pair = `${w.currency}/USDT`;
      const price = priceMap.get(pair);
      if (price) total = total.plus(balance.mul(price));
    }
  }
  return total.toFixed(2);
}
