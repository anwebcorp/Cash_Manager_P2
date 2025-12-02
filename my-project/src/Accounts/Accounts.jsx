import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function Accounts() {
  const { auth } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axiosInstance.get('list/projects/');
        setProjects(response.data);
        if (response.data.length > 0 && !selectedProject) {
          setSelectedProject(response.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };

    if (auth?.accessToken) {
      fetchProjects();
      fetchAccountsAndTransactions();
    }
  }, [auth?.accessToken, selectedProject]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setCreateSuccess('');

    try {
      await axiosInstance.post('create/account/', {
        name: formData.name,
        balance: formData.balance || 0,
      });

      setFormData({ name: '', balance: '' });
      setShowCreateForm(false);
      
      // Fetch updated accounts list after creation
      const response = await axiosInstance.get('view/all/accounts/');
      setAccounts(response.data);
      setCreateSuccess('Account created successfully!');
      setCreateLoading(false);
    } catch (err) {
      setError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create account');
      console.error('Account creation error:', err);
      setCreateLoading(false);
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

  // Calculate totals from transactions for selected account
  const accountTransactions = selectedAccount ? transactions.filter(t => t.account === selectedAccount.id) : [];
  
  const accountCashIn = accountTransactions
    .filter(t => t.transaction_type === 'cash_in')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const accountCashOut = accountTransactions
    .filter(t => t.transaction_type === 'cash_out')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const accountBalance = selectedAccount ? parseFloat(selectedAccount.balance) || 0 : 0;
  
  const accountCashInCount = accountTransactions.filter(t => t.transaction_type === 'cash_in').length;
  const accountCashOutCount = accountTransactions.filter(t => t.transaction_type === 'cash_out').length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="flex items-center space-x-2 text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Menu</span>
        </button>
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="hidden md:grid md:grid-cols-4 gap-6 p-6 bg-gray-100 min-h-screen max-w-full">
        {/* Left Sidebar */}
        <div className="col-span-1 space-y-3 h-fit sticky top-6">
          {/* Accounts Dropdown */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="font-semibold text-blue-600 truncate">
                  {selectedAccount?.name || 'Select Account'}
                </span>
                <svg className={`w-5 h-5 text-blue-600 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {showAccountDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowAccountDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 ${selectedAccount?.id === account.id ? 'bg-blue-50' : ''}`}
                    >
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">Rs. {Math.round(parseFloat(account.balance) || 0)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              {showCreateForm ? '✕ Cancel' : '+ New Account'}
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="col-span-3 space-y-5">
          {error && <p className="text-red-500 p-4 bg-red-100 rounded-lg text-base">{error}</p>}
          {createSuccess && <p className="text-green-500 p-4 bg-green-100 rounded-lg text-base">{createSuccess}</p>}

          {/* Create Account Form */}
          {showCreateForm && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Create New Account</h2>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block mb-2 font-semibold">Account Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    placeholder="Enter account name"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Initial Balance (Optional)</label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    placeholder="0"
                    step="1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-600">Loading accounts...</p>
          ) : selectedAccount ? (
            <>
              {/* Account Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cash In Card */}
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold opacity-90 mb-1">Cash In</p>
                      <p className="text-2xl font-bold truncate break-words">Rs. {Math.round(accountCashIn)}</p>
                      <p className="text-xs opacity-75 mt-2">
                        {accountCashInCount} transaction{accountCashInCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                    </svg>
                  </div>
                </div>

                {/* Cash Out Card */}
                <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-5 text-white shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold opacity-90 mb-1">Cash Out</p>
                      <p className="text-2xl font-bold truncate break-words">Rs. {Math.round(accountCashOut)}</p>
                      <p className="text-xs opacity-75 mt-2">
                        {accountCashOutCount} transaction{accountCashOutCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                    </svg>
                  </div>
                </div>

                {/* Net Balance Card */}
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold opacity-90 mb-1">Net Balance</p>
                      <p className="text-2xl font-bold truncate break-words">Rs. {Math.round(accountBalance)}</p>
                      <p className="text-xs opacity-75 mt-2">Current</p>
                    </div>
                    <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              {accountTransactions.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountTransactions.slice().reverse().map((t, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-900">{new Date(t.date || t.created_at).toLocaleDateString()}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${t.transaction_type === 'cash_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {t.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                              </span>
                            </td>
                            <td className="text-right py-3 px-4">
                              <p className={`font-semibold ${t.transaction_type === 'cash_in' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.transaction_type === 'cash_in' ? '+' : '-'}Rs. {Math.round(parseFloat(t.amount) || 0)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <p className="text-gray-500 text-lg">No transactions for this account</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">Select an account to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Content Area */}
      <div className="md:hidden w-full p-4 space-y-4 pb-8">
        {/* Accounts Dropdown for Mobile */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="relative">
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="font-semibold text-blue-600 truncate">
                {selectedAccount?.name || 'Select Account'}
              </span>
              <svg className={`w-5 h-5 text-blue-600 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {showAccountDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowAccountDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 ${selectedAccount?.id === account.id ? 'bg-blue-50' : ''}`}
                  >
                    <p className="font-semibold text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-500">Rs. {Math.round(parseFloat(account.balance) || 0)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Action Button */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            {showCreateForm ? '✕ Cancel' : '+ New Account'}
          </button>
        </div>

        {error && <p className="text-red-500 p-4 bg-red-100 rounded-lg text-base">{error}</p>}
        {createSuccess && <p className="text-green-500 p-4 bg-green-100 rounded-lg text-base">{createSuccess}</p>}

        {/* Create Account Form - Mobile */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Create New Account</h2>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold">Account Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  placeholder="Enter account name"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">Initial Balance (Optional)</label>
                <input
                  type="number"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  placeholder="0"
                  step="1"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {createLoading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-600">Loading accounts...</p>
        ) : selectedAccount ? (
          <>
            {/* Mobile Summary Cards */}
            <div className="space-y-3">
              {/* Cash In Card */}
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Cash In</p>
                    <p className="text-xl font-bold truncate break-words">Rs. {Math.round(accountCashIn)}</p>
                    <p className="text-xs opacity-75 mt-2">
                      {accountCashInCount} transaction{accountCashInCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                  </svg>
                </div>
              </div>

              {/* Cash Out Card */}
              <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Cash Out</p>
                    <p className="text-xl font-bold truncate break-words">Rs. {Math.round(accountCashOut)}</p>
                    <p className="text-xs opacity-75 mt-2">
                      {accountCashOutCount} transaction{accountCashOutCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                  </svg>
                </div>
              </div>

              {/* Net Balance Card */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Net Balance</p>
                    <p className="text-xl font-bold truncate break-words">Rs. {Math.round(accountBalance)}</p>
                    <p className="text-xs opacity-75 mt-2">Current</p>
                  </div>
                  <svg className="w-10 h-10 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mobile Transaction History */}
            {accountTransactions.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h2>
                <div className="space-y-3">
                  {accountTransactions.slice().reverse().map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{new Date(t.date || t.created_at).toLocaleDateString()}</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${t.transaction_type === 'cash_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {t.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                        </span>
                      </div>
                      <p className={`font-semibold text-lg ${t.transaction_type === 'cash_in' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.transaction_type === 'cash_in' ? '+' : '-'}Rs. {Math.round(parseFloat(t.amount) || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">No transactions for this account</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">Select an account to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
