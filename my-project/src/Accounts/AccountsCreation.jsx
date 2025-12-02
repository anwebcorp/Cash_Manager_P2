import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function AccountsCreation() {
  const { auth } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
  });

  // Fetch accounts on component mount
  useEffect(() => {
    if (auth?.accessToken) {
      fetchAccounts();
    }
  }, [auth?.accessToken]);

  const fetchAccounts = async () => {
    try {
      const response = await axiosInstance.get('view/all/accounts/');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to fetch accounts');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axiosInstance.post('create/account/', {
        name: formData.name,
        balance: formData.balance || 0,
      });

      setFormData({ name: '', balance: '' });
      setShowForm(false);
      
      // Fetch updated accounts list after creation
      const response = await axiosInstance.get('view/all/accounts/');
      console.log('Accounts fetched after creation:', response.data);
      setAccounts(response.data);
      setSuccess('Account created successfully!');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create account');
      console.error('Account creation error:', err);
      setLoading(false);
    }
  };

  if (!auth?.user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : '+ New Account'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded">{error}</p>}
      {success && <p className="text-green-500 mb-4 p-3 bg-green-100 rounded">{success}</p>}

      {/* Create Account Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <div className="mb-4">
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

          <div className="mb-4">
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
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      )}

      {/* Accounts List */}
      {loading && !showForm ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : accounts.length === 0 ? (
        <p className="text-center text-gray-600">No accounts found. Create your first account!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-3 text-left">ID</th>
                <th className="border border-gray-300 p-3 text-left">Account Name</th>
                <th className="border border-gray-300 p-3 text-left">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">{account.id}</td>
                  <td className="border border-gray-300 p-3 font-semibold">{account.name}</td>
                  <td className="border border-gray-300 p-3">Rs. {parseFloat(account.balance || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p>Total Accounts: {accounts.length}</p>
      </div>
    </div>
  );
}
