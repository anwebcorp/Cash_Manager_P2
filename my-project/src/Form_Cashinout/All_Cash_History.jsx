import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function AllCashHistory() {
  const { auth } = useAuth();
  const [step, setStep] = useState(null); // null, 'type-selection', 'project-selection', 'account-selection', 'history'
  const [type, setType] = useState(null); // 'cash-in' or 'cash-out'
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordImages, setRecordImages] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);

  // Fetch projects on component mount
  useEffect(() => {
    if (auth?.accessToken) {
      fetchProjects();
      fetchAccounts();
    }
  }, [auth?.accessToken]);

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get('list/projects/');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to fetch projects');
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axiosInstance.get('view/all/accounts/');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to fetch accounts');
    }
  };

  const fetchCashInHistory = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      // Fetch all cash in history and filter by project if needed
      const response = await axiosInstance.get(`cashin/history/all/`);
      setHistory(response.data);
      setStep('history');
    } catch (err) {
      setError('Failed to fetch cash in history');
      console.error('Error fetching cash in history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashOutHistory = async (accountId) => {
    setLoading(true);
    setError('');
    try {
      // Fetch all cash out history
      const response = await axiosInstance.get(`cashout/history/all/`);
      setHistory(response.data);
      setStep('history');
    } catch (err) {
      setError('Failed to fetch cash out history');
      console.error('Error fetching cash out history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = (selectedType) => {
    setType(selectedType);
    if (selectedType === 'cash-in') {
      setStep('project-selection');
    } else {
      setStep('account-selection');
    }
  };

  const handleProjectSelection = (projectId) => {
    setSelectedProject(projectId);
    fetchCashInHistory(projectId);
  };

  const handleAccountSelection = (accountId) => {
    setSelectedAccount(accountId);
    fetchCashOutHistory(accountId);
  };

  const handleSelectRecord = (record) => {
    const recordData = record.cashout || record;
    setSelectedRecord({ ...recordData, type });
    const images = recordData.bill_images || [];
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

  const handleReset = () => {
    setStep(null);
    setType(null);
    setSelectedProject(null);
    setSelectedAccount(null);
    setHistory([]);
    setError('');
  };

  if (!auth?.user) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Image Zoom Modal */}
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
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {type === 'cash-in' ? 'Cash In' : 'Cash Out'} Details
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
                  <p className={`text-lg font-bold ${type === 'cash-in' ? 'text-green-600' : 'text-red-600'}`}>
                    Rs. {typeof selectedRecord.amount === 'number' ? selectedRecord.amount : selectedRecord.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Account</p>
                  <p className="text-lg text-gray-900">{selectedRecord.account_name || `Account #${selectedRecord.account}`}</p>
                </div>
                {type === 'cash-in' && selectedRecord.cash_from && (
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
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>All Cash History</span>
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Type Selection */}
      {!step && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleTypeSelection('cash-in')}
            className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-4">
              <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Cash In</h3>
              <p className="text-sm text-gray-600 text-center">View all cash in history by project</p>
            </div>
          </button>

          <button
            onClick={() => handleTypeSelection('cash-out')}
            className="p-8 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-4">
              <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m-8-8h16" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">Cash Out</h3>
              <p className="text-sm text-gray-600 text-center">View all cash out history by account</p>
            </div>
          </button>
        </div>
      )}

      {/* Step 2: Project Selection (for Cash In) */}
      {step === 'project-selection' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select a Project</h2>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
            >
              ← Change Type
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No projects found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelection(project.id)}
                  className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Project ID: {project.id}</p>
                    </div>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Account Selection (for Cash Out) */}
      {step === 'account-selection' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select an Account</h2>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
            >
              ← Change Type
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No accounts found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelection(account.id)}
                  className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Balance: Rs. {account.balance}</p>
                    </div>
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: History Display */}
      {step === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {type === 'cash-in' ? `Cash In History - Project #${selectedProject}` : `Cash Out History - Account #${selectedAccount}`}
            </h2>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
            >
              ← Go Back
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-600 py-8">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No records found</p>
          ) : (
            <>
              {/* Summary Card */}
              <div className={`mb-6 rounded-lg p-6 border ${type === 'cash-in' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-sm font-semibold mb-2 ${type === 'cash-in' ? 'text-emerald-700' : 'text-red-700'}`}>
                      Total {type === 'cash-in' ? 'Cash In' : 'Cash Out'}
                    </p>
                    <p className={`text-4xl font-bold ${type === 'cash-in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      Rs. {history.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0)}
                    </p>
                    <p className={`text-sm mt-2 ${type === 'cash-in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {history.length} transaction{history.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-3xl">{type === 'cash-in' ? '💵' : '💸'}</div>
                </div>
              </div>

              {/* Records */}
              <div className="space-y-3">
                {history.map((record) => {
                  const recordData = record.cashout || record;
                  return (
                    <div
                      key={record.id}
                      onClick={() => handleSelectRecord(record)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-semibold text-gray-600">{recordData.sr_no}</span>
                            <span className="text-xs text-gray-500">📅 {recordData.date}</span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {type === 'cash-in' ? recordData.cash_from || 'N/A' : recordData.account_name || `Account #${recordData.account}`}
                          </p>
                          {recordData.description && (
                            <p className="text-xs text-blue-600 mt-2 cursor-pointer hover:underline">
                              View Bill Image →
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${type === 'cash-in' ? 'text-green-600' : 'text-red-600'}`}>
                            Rs. {recordData.amount}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
