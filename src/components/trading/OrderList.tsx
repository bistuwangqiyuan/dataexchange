/**
 * 订单列表组件
 * 显示当前委托订单和历史订单
 */

import { useState, useEffect } from 'react';
import type { OrderResponse } from '@/types/api.types';

interface OrderListProps {
  refreshTrigger?: number;
}

export default function OrderList({ refreshTrigger }: OrderListProps) {
  const [activeOrders, setActiveOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveOrders();
  }, [refreshTrigger]);

  const fetchActiveOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/active');
      const result = await response.json();

      if (result.success) {
        setActiveOrders(result.data || []);
      } else {
        setMessage(result.error?.message || '获取订单失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('确定要取消这个订单吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/cancel/${orderId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setMessage('订单已取消');
        fetchActiveOrders(); // 刷新列表
      } else {
        setMessage(result.error?.message || '取消失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatNumber = (value: string) => {
    return parseFloat(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="p-6 text-center">
          <div className="spinner w-8 h-8 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">加载订单中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">当前委托</h3>
          <button
            onClick={fetchActiveOrders}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            刷新
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
            {message}
          </div>
        )}

        {activeOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">暂无委托订单</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              下单后，未成交的订单会显示在这里
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>交易对</th>
                  <th>类型</th>
                  <th>方向</th>
                  <th className="text-right">价格</th>
                  <th className="text-right">数量</th>
                  <th className="text-right">已成交</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.trading_pair}</td>
                    <td>
                      <span className="text-sm">
                        {order.order_type === 'market' ? '市价' : '限价'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`text-sm font-medium ${
                          order.side === 'buy' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {order.side === 'buy' ? '买入' : '卖出'}
                      </span>
                    </td>
                    <td className="text-right font-mono">
                      {order.price ? formatNumber(order.price) : '市价'}
                    </td>
                    <td className="text-right font-mono">
                      {formatNumber(order.quantity)}
                    </td>
                    <td className="text-right font-mono">
                      {formatNumber(order.filled_quantity)}
                    </td>
                    <td>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : order.status === 'filled'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status === 'pending' && '待成交'}
                        {order.status === 'filled' && '已成交'}
                        {order.status === 'cancelled' && '已取消'}
                        {order.status === 'partially_filled' && '部分成交'}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          取消
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>• 仅显示待成交的订单</p>
          <p>• 已成交或已取消的订单请查看历史记录</p>
        </div>
      </div>
    </div>
  );
}

