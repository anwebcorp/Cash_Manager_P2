import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function CashHistory({ projectId, refreshTrigger = 0 }) {
  const { auth } = useAuth();
  const [cashInHistory, setCashInHistory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordImages, setRecordImages] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Fetch project history and accounts on mount or when projectId changes
  useEffect(() => {
    if (auth?.accessToken && projectId) {
      fetchAccounts();
      fetchProjectHistory(projectId);
    }
  }, [auth?.accessToken, projectId, refreshTrigger]);

  const fetchAccounts = async () => {
    try {
      const response = await axiosInstance.get('view/all/accounts/');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchProjectHistory = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch cash in history for the project
      const cashInRes = await axiosInstance.get(`cashin/history/all/`);
      setCashInHistory(cashInRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch cash in history');
      }
      console.error('Error fetching project history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashInHistory = async (accountId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`cashin/history/${accountId}/`);
      setCashInHistory(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch cash in history');
      }
      console.error('Error fetching cash in history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (accountId) => {
    setSelectedAccount(accountId);
    fetchCashInHistory(accountId);
  };

  const handleSelectCashInRecord = (record) => {
    setSelectedRecord({ ...record, type: 'cashin' });
    // Extract images and deduplicate by comparing image filenames
    const images = record.bill_images || [];
    const uniqueImages = [];
    const seenFilenames = new Set();
    
    for (const img of images) {
      // Extract filename from URL
      const filename = img.image.split('/').pop();
      if (!seenFilenames.has(filename)) {
        seenFilenames.add(filename);
        uniqueImages.push(img);
      }
    }
    
    console.log('Cash In Record Images:', images);
    console.log('Deduplicated Images:', uniqueImages);
    setRecordImages(uniqueImages);
  };

  const _handleSelectCashOutRecord = () => {
    // Placeholder for future functionality
  };

  // Handle ESC key to close zoom
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && zoomedImage) {
        setZoomedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [zoomedImage]);

  if (!auth?.user) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <p className="text-red-600">Please log in first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Image Zoom Modal - HIGHEST Z-INDEX */}
      {zoomedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.98)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '0',
            margin: '0',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden'
          }}
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              padding: '0',
              margin: '0',
              display: 'block'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: 'fixed',
              top: '30px',
              right: '30px',
              backgroundColor: 'white',
              borderRadius: '50%',
              padding: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              zIndex: 100000,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.transform = 'scale(1)';
            }}
            title="Close (ESC)"
          >
            <svg style={{ width: '28px', height: '28px', color: '#1f2937' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div 
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              zIndex: 100000,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            Press ESC or click outside to close
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRecord.type === 'cashin' ? 'Cash In' : 'Cash Out'} Details
              </h2>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setRecordImages([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Record Information */}
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Serial Number</p>
                  <p className="text-lg text-gray-900">{selectedRecord.sr_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Date</p>
                  <p className="text-lg text-gray-900">{selectedRecord.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Amount</p>
                  <p className={`text-lg font-bold ${selectedRecord.type === 'cashin' ? 'text-green-600' : 'text-red-600'}`}>
                    Rs. {typeof selectedRecord.amount === 'number' ? selectedRecord.amount : selectedRecord.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Account</p>
                  <p className="text-lg text-gray-900">{selectedRecord.account_name || `Account #${selectedRecord.account}`}</p>
                </div>
                {selectedRecord.type === 'cashin' && selectedRecord.cash_from && (
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Cash From</p>
                    <p className="text-lg text-gray-900">{selectedRecord.cash_from}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Created</p>
                  <p className="text-lg text-gray-900">{new Date(selectedRecord.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Description */}
              {selectedRecord.description && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Description</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedRecord.description}</p>
                </div>
              )}

              {/* Images */}
              {recordImages.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-3">Uploaded Images ({recordImages.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {recordImages.map((image) => (
                      <div key={`${image.id}-${image.image}`} className="relative group">
                        <img
                          src={image.image}
                          alt={`Receipt ${image.id}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
                          onClick={() => setZoomedImage(image.image)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">🔍 Zoom</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setRecordImages([]);
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center space-x-2">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Cash In History</span>
      </h1>

      {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm md:text-base">{error}</p>}

      {/* Tab Navigation - Hidden, only show cash in */}
      <div className="hidden">
        <button
          className="px-3 md:px-4 py-2 font-medium text-xs md:text-sm border-b-2 transition-colors border-blue-500 text-blue-600"
        >
          Cash In
        </button>
      </div>

      {/* Account Selection Section */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Select Account to View History</p>
        <select
          value={selectedAccount || ''}
          onChange={(e) => handleAccountSelect(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name} (Balance: Rs. {acc.balance})
            </option>
          ))}
        </select>
      </div>

      {/* Summary Card */}
      {selectedAccount && cashInHistory.length > 0 && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-emerald-700 mb-2">Total Cash In</p>
              <p className="text-4xl font-bold text-emerald-600">
                Rs. {cashInHistory.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0)}
              </p>
              <p className="text-sm text-emerald-600 mt-2">{cashInHistory.length} transaction{cashInHistory.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-3xl text-emerald-600">💵</div>
          </div>
        </div>
      )}

      {/* Cash In Records */}
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : !selectedAccount ? (
        <p className="text-center text-gray-600 py-8">Select an account to view cash in history</p>
      ) : cashInHistory.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No cash in records found for this account</p>
      ) : (
        <div className="space-y-3">
          {cashInHistory.map((record) => (
            <div 
              key={record.id}
              onClick={() => handleSelectCashInRecord(record)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-semibold text-gray-600">{record.sr_no}</span>
                    <span className="text-xs text-gray-500">📅 {record.date}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{record.cash_from || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">From me</p>
                  {record.description && (
                    <p className="text-xs text-blue-600 mt-2 cursor-pointer hover:underline">
                      View Bill Image →
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">Rs. {record.amount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
