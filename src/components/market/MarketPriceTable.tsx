import { useEffect, useState } from 'react';
import type { FC } from 'react';

interface MarketTicker {
  trading_pair: string;
  price: string;
  change_24h: string;
  high_24h: string;
  low_24h: string;
  volume_24h: string;
}

export const MarketPriceTable: FC = () => {
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickers();
    const interval = setInterval(fetchTickers, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTickers = async () => {
    try {
      const response = await fetch('/api/market/tickers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickers');
      }

      const data = await response.json();
      setTickers(data.data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchTickers}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Pair
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              24h Change
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              24h High
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              24h Low
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              24h Volume
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {tickers.map((ticker) => {
            const change = parseFloat(ticker.change_24h);
            const isPositive = change >= 0;
            
            return (
              <tr key={ticker.trading_pair} className="hover:bg-gray-800 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-white font-medium">{ticker.trading_pair}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-white font-medium">
                  ${parseFloat(ticker.price).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-300">
                  ${parseFloat(ticker.high_24h).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-300">
                  ${parseFloat(ticker.low_24h).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-300">
                  ${(parseFloat(ticker.volume_24h) / 1e6).toFixed(2)}M
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <a
                    href={`/trade?pair=${ticker.trading_pair.replace('/', '-')}`}
                    className="text-blue-500 hover:text-blue-400 font-medium"
                  >
                    Trade
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tickers.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No market data available
        </div>
      )}

      <div className="mt-4 text-center text-xs text-gray-500">
        Last updated: {new Date().toLocaleTimeString()} • Auto-refresh every 10s
      </div>
    </div>
  );
};

export default MarketPriceTable;

