import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function Accounts() {
  const { auth } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth?.accessToken) {
      fetchAccountsAndTransactions();
    }
  }, [auth?.accessToken]);

  const fetchAccountsAndTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch accounts
      const accountsResponse = await axiosInstance.get('view/all/accounts/');
      setAccounts(accountsResponse.data);
      
      // Fetch all cash in history
      const cashInResponse = await axiosInstance.get('cashin/history/all/');
      const cashInData = cashInResponse.data || [];
      
      // Fetch all cash out history
      const cashOutResponse = await axiosInstance.get('cashout/history/all/');
      const cashOutData = cashOutResponse.data || [];
      
      // Combine all transactions
      const allTransactions = [
        ...cashInData.map(t => ({ ...t, transaction_type: 'cash_in' })),
        ...cashOutData.map(t => ({ ...t, transaction_type: 'cash_out' }))
      ];
      
      setTransactions(allTransactions);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch data');
      }
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!auth?.user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <p className="text-red-600">Please log in first</p>
        </div>
      </div>
    );
  }

  // Calculate totals from transactions
  const totalCashIn = transactions
    .filter(t => t.transaction_type === 'cash_in')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const totalCashOut = transactions
    .filter(t => t.transaction_type === 'cash_out')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const remainingBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  
  const cashInCount = transactions.filter(t => t.transaction_type === 'cash_in').length;
  const cashOutCount = transactions.filter(t => t.transaction_type === 'cash_out').length;

  return (
    <div className="w-full">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 flex items-center space-x-2">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span>Accounts Overview</span>
      </h1>

      {error && <p className="text-red-500 mb-6 p-4 bg-red-100 rounded-lg text-base">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-600">Loading accounts...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Cash In Card */}
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold opacity-90 mb-1">Total Cash In</p>
                  <p className="text-4xl font-bold">${Math.round(totalCashIn)}</p>
                  <p className="text-sm opacity-75 mt-2">
                    {cashInCount} transaction{cashInCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                </svg>
              </div>
            </div>

            {/* Total Cash Out Card */}
            <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold opacity-90 mb-1">Total Cash Out</p>
                  <p className="text-4xl font-bold">${Math.round(totalCashOut)}</p>
                  <p className="text-sm opacity-75 mt-2">
                    {cashOutCount} transaction{cashOutCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                </svg>
              </div>
            </div>

            {/* Remaining Balance Card */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold opacity-90 mb-1">Remaining Balance</p>
                  <p className="text-4xl font-bold">${Math.round(remainingBalance)}</p>
                  <p className="text-sm opacity-75 mt-2">Available</p>
                </div>
                <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction Summary</h2>
            <div className="space-y-4">
              {/* Cash In Transactions */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Cash In Transactions</p>
                    <p className="text-sm text-gray-500">
                      {cashInCount} total
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-emerald-600">${Math.round(totalCashIn)}</p>
              </div>

              {/* Cash Out Transactions */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Cash Out Transactions</p>
                    <p className="text-sm text-gray-500">
                      {cashOutCount} total
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-red-600">-${Math.round(totalCashOut)}</p>
              </div>

              {/* Net Balance */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Net Balance</p>
                    <p className="text-sm text-gray-500">Positive balance</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-600">+${Math.round(remainingBalance)}</p>
              </div>
            </div>
          </div>

          {/* Individual Accounts */}
          {accounts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Accounts Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Account Name</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{account.name}</p>
                        </td>
                        <td className="text-right py-3 px-4">
                          <p className="text-blue-600 font-semibold">${Math.round(parseFloat(account.balance) || 0)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {accounts.length === 0 && !loading && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">No accounts available</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
