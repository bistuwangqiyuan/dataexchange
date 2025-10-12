import { useEffect, useState } from 'react';
import type { FC } from 'react';

interface Order {
  id: string;
  trading_pair: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit';
  status: string;
  price: string | null;
  quantity: string;
  filled_quantity: string;
  created_at: string;
  updated_at: string;
}

export const OrderHistoryList: FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/orders/history?page=${page}&page_size=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }

      const data = await response.json();
      setOrders(data.data?.items || []);
      setTotalPages(data.data?.pagination?.total_pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'filled': 'bg-green-100 text-green-800',
      'partial_filled': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'failed': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading order history...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pair</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Side</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Filled</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                  {order.trading_pair}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                  {order.order_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-semibold ${order.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {order.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                  {order.price ? `$${parseFloat(order.price).toLocaleString()}` : 'Market'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white">
                  {parseFloat(order.quantity).toFixed(8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                  {parseFloat(order.filled_quantity).toFixed(8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No order history yet
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryList;

