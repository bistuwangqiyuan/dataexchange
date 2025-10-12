import { useEffect, useState } from 'react';
import type { FC } from 'react';

interface WalletBalance {
  id: string;
  currency: string;
  balance: string;
  frozen: string;
  updated_at: string;
}

export const WalletBalances: FC = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/wallet/balances', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const data = await response.json();
      setBalances(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading balances...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Currency
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Available
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Frozen
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {balances.map((wallet) => {
            const available = parseFloat(wallet.balance) - parseFloat(wallet.frozen);
            const total = parseFloat(wallet.balance);
            
            return (
              <tr key={wallet.id} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {wallet.currency.slice(0, 2)}
                    </div>
                    <span className="text-white font-medium">{wallet.currency}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-white">
                  {available.toFixed(8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                  {parseFloat(wallet.frozen).toFixed(8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-white font-medium">
                  {total.toFixed(8)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {balances.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No balances found. Start by depositing some crypto!
        </div>
      )}
    </div>
  );
};

export default WalletBalances;

