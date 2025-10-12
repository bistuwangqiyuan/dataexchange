/**
 * 交易表单组件
 * 支持市价单和限价单的买入/卖出
 */

import { useState, useEffect } from 'react';
import type { OrderType, OrderSide } from '@/types/database.types';

interface OrderFormProps {
  tradingPair: string;
  currentPrice: string;
  onOrderCreated?: () => void;
}

export default function OrderForm({ tradingPair, currentPrice, onOrderCreated }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [side, setSide] = useState<OrderSide>('buy');
  const [price, setPrice] = useState(currentPrice);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 同步当前价格到表单
  useEffect(() => {
    if (orderType === 'market') {
      setPrice(currentPrice);
    }
  }, [currentPrice, orderType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trading_pair: tradingPair,
          order_type: orderType,
          side,
          price: orderType === 'limit' ? price : undefined,
          quantity,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '订单创建成功！' });
        setQuantity('');
        if (orderType === 'limit') {
          setPrice(currentPrice);
        }
        onOrderCreated?.();
      } else {
        setMessage({
          type: 'error',
          text: result.error?.message || '订单创建失败',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!quantity || !price) return '0';
    return (parseFloat(quantity) * parseFloat(price)).toFixed(2);
  };

  return (
    <div className="card">
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">下单交易</h3>

        {/* 订单类型选择 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              orderType === 'limit'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            限价单
          </button>
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              orderType === 'market'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            市价单
          </button>
        </div>

        {/* 买卖方向选择 */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSide('buy')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              side === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            买入
          </button>
          <button
            type="button"
            onClick={() => setSide('sell')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              side === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            卖出
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 价格输入（仅限价单） */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                价格 (USDT)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input"
                placeholder="请输入价格"
                required
              />
            </div>
          )}

          {/* 市价单显示当前价格 */}
          {orderType === 'market' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                当前市价 (USDT)
              </label>
              <div className="input bg-gray-100 dark:bg-gray-800">
                {currentPrice}
              </div>
            </div>
          )}

          {/* 数量输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              数量
            </label>
            <input
              type="number"
              step="0.00000001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              placeholder="请输入数量"
              required
            />
          </div>

          {/* 总价显示 */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                总价
              </span>
              <span className="text-lg font-bold">
                {calculateTotal()} USDT
              </span>
            </div>
          </div>

          {/* 消息提示 */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              side === 'buy'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="spinner mr-2"></span>
                处理中...
              </span>
            ) : (
              <span>{side === 'buy' ? '买入' : '卖出'} {tradingPair}</span>
            )}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>• 市价单立即按市场价成交</p>
          <p>• 限价单将在价格达到时自动成交</p>
          <p>• 下单时将冻结相应资产</p>
        </div>
      </div>
    </div>
  );
}

