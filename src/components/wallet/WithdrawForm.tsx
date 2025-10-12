import { useState, useEffect } from 'react';
import type { FC } from 'react';

interface WithdrawFormProps {
  onSuccess?: () => void;
}

export const WithdrawForm: FC<WithdrawFormProps> = ({ onSuccess }) => {
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [availableBalance, setAvailableBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const currencies = ['USDT', 'BTC', 'ETH', 'BNB', 'XRP', 'ADA'];

  useEffect(() => {
    fetchBalance();
  }, [currency]);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/wallet/balances', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const wallet = data.data?.find((w: any) => w.currency === currency);
        if (wallet) {
          const available = parseFloat(wallet.balance) - parseFloat(wallet.frozen);
          setAvailableBalance(available.toFixed(8));
        }
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(availableBalance)) {
      setError('Insufficient balance');
      return;
    }

    if (!address) {
      setError('Please enter withdrawal address');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/wallet/${currency}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Withdrawal failed');
      }

      setSuccess(true);
      setAmount('');
      setAddress('');
      
      setTimeout(() => {
        setSuccess(false);
        fetchBalance();
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded mb-4 text-sm">
        <strong>Demo Mode:</strong> This is a simulated withdrawal for demonstration purposes only.
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">
          Withdrawal request submitted! Your balance has been updated.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleWithdraw} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Available: {availableBalance} {currency}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            step="0.00000001"
            min="0"
            max={availableBalance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            required
          />
          <button
            type="button"
            onClick={() => setAmount(availableBalance)}
            className="mt-1 text-xs text-blue-500 hover:underline"
          >
            Use Max
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Withdrawal Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter wallet address"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>
    </div>
  );
};

export default WithdrawForm;

