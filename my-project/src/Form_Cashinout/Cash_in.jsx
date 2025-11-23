import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function CashIn({ projectId = null, onCashInCreated = null }) {
  const { auth } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    sr_no: '',
    date: '',
    description: '',
    cash_from: '',
    account: '',
    amount: '',
  });
  const [images, setImages] = useState([]);

  // Fetch accounts on mount
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
      setError('Failed to fetch accounts');
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      form.append('sr_no', formData.sr_no);
      form.append('date', formData.date);
      form.append('description', formData.description);
      form.append('cash_from', formData.cash_from);
      form.append('account', formData.account);
      form.append('amount', formData.amount);

      // Append images
      images.forEach(img => {
        form.append('images', img);
      });

      await axiosInstance.post('cashin/account/', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Cash In recorded successfully!');
      setFormData({
        sr_no: '',
        date: '',
        description: '',
        cash_from: '',
        account: '',
        amount: '',
      });
      setImages([]);
      
      // Trigger history refresh
      if (onCashInCreated) {
        onCashInCreated();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to submit cash in');
      }
      console.error('Cash In error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!auth?.user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <p className="text-red-600">Please log in first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Cash In Form</h1>

        {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm md:text-base">{error}</p>}
        {success && <p className="text-green-500 mb-4 p-3 bg-green-100 rounded text-sm md:text-base">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div>
            <label className="block mb-2 font-semibold text-sm md:text-base">Serial Number</label>
            <input
              type="text"
              name="sr_no"
              value={formData.sr_no}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-sm md:text-base"
              placeholder="SR-001"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm md:text-base">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-sm md:text-base"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm md:text-base">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-sm md:text-base"
              placeholder="Enter description"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm md:text-base">Cash From</label>
            <input
              type="text"
              name="cash_from"
              value={formData.cash_from}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-sm md:text-base"
              placeholder="Source of cash"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm md:text-base">Select Account</label>
            <select
              name="account"
              value={formData.account}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-sm md:text-base"
              required
            >
              <option value="">-- Select Account --</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Balance: ${acc.balance})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm md:text-base">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-sm md:text-base"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm md:text-base">Bill Images</label>
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              className="w-full border p-2 rounded text-sm md:text-base"
              accept="image/*"
            />
            {images.length > 0 && (
              <p className="mt-2 text-xs md:text-sm text-gray-600">{images.length} image(s) selected</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm md:text-base font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Cash In'}
          </button>
        </form>
    </div>
  );
}
