import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function CashOutHistory({ projectId, refreshTrigger = 0 }) {
  const { auth } = useAuth();
  const [cashOutHistory, setCashOutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordImages, setRecordImages] = useState([]);

  useEffect(() => {
    if (auth?.accessToken && projectId) {
      fetchCashOutHistory(projectId);
    }
  }, [auth?.accessToken, projectId, refreshTrigger]);

  const fetchCashOutHistory = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`cashout/history/project/${projectId}/`);
      setCashOutHistory(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch cash out history');
      }
      console.error('Error fetching cash out history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCashOutRecord = (record) => {
    const cashoutData = record.cashout || record;
    setSelectedRecord({ ...cashoutData, type: 'cashout' });
    const images = cashoutData.bill_images || [];
    const uniqueImages = [];
    const seenFilenames = new Set();
    
    for (const img of images) {
      const filename = img.image.split('/').pop();
      if (!seenFilenames.has(filename)) {
        seenFilenames.add(filename);
        uniqueImages.push(img);
      }
    }
    
    setRecordImages(uniqueImages);
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

  return (
    <div className="w-full">
      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Cash Out Details</h2>
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

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
                  <p className="text-lg font-bold text-red-600">
                    ${typeof selectedRecord.amount === 'number' ? selectedRecord.amount.toFixed(2) : selectedRecord.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Account</p>
                  <p className="text-lg text-gray-900">{selectedRecord.account_name || `Account #${selectedRecord.account}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Created</p>
                  <p className="text-lg text-gray-900">{new Date(selectedRecord.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedRecord.description && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Description</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedRecord.description}</p>
                </div>
              )}

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
                          onClick={() => window.open(image.image, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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

      <h1 className="text-xl md:text-2xl font-bold mb-6 flex items-center space-x-2">
        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <span>Cash Out History</span>
      </h1>

      {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded text-sm md:text-base">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : cashOutHistory.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No cash out records found</p>
      ) : (
        <>
          {/* Summary Card */}
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-red-700 mb-2">Total Cash Out</p>
                <p className="text-4xl font-bold text-red-600">
                  ${cashOutHistory.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0).toFixed(2)}
                </p>
                <p className="text-sm text-red-600 mt-2">{cashOutHistory.length} transaction{cashOutHistory.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-3xl">💸</div>
            </div>
          </div>

          {/* Cash Out Records */}
          <div className="space-y-3">
            {cashOutHistory.map((record) => (
              <div 
                key={record.id}
                onClick={() => handleSelectCashOutRecord(record)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-semibold text-gray-600">{record.cashout?.sr_no || record.sr_no}</span>
                      <span className="text-xs text-gray-500">📅 {record.cashout?.date || record.date}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{record.cashout?.account_name || `Account #${record.cashout?.account || record.account}`}</p>
                    {record.cashout?.description && (
                      <p className="text-xs text-blue-600 mt-2 cursor-pointer hover:underline">
                        View Bill Image →
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">${record.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
