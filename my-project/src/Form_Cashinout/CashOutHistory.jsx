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
  const [zoomedImage, setZoomedImage] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId || null);
  const [showProjectSelection, setShowProjectSelection] = useState(!projectId);

  useEffect(() => {
    if (auth?.accessToken) {
      fetchProjects();
    }
  }, [auth?.accessToken]);

  useEffect(() => {
    if (auth?.accessToken && selectedProject) {
      fetchCashOutHistory(selectedProject);
    }
  }, [auth?.accessToken, selectedProject, refreshTrigger]);

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get('list/projects/');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to fetch projects');
    }
  };

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

  const handleProjectSelection = (projectId) => {
    setSelectedProject(projectId);
    setShowProjectSelection(false);
  };

  const handleChangeProject = () => {
    setShowProjectSelection(true);
    setSelectedProject(null);
    setCashOutHistory([]);
    setError('');
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

  const downloadImage = async (imageUrl, imageName) => {
    try {
      // Try to download using axios with auth headers
      const response = await axiosInstance({
        url: imageUrl,
        method: 'GET',
        responseType: 'blob',
        timeout: 30000
      });
      
      // Create object URL from the blob
      const url = window.URL.createObjectURL(response.data);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName || imageUrl.split('/').pop() || 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup URL object after download starts
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 250);
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback to direct download if axios fails
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = imageName || imageUrl.split('/').pop() || 'image.jpg';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        alert('Unable to download image. Please try again or download manually.');
      }
    }
  };

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
                    Rs. {Math.round(typeof selectedRecord.amount === 'number' ? selectedRecord.amount : selectedRecord.amount)}
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
                          onClick={() => setZoomedImage(image.image)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(image.image, `receipt-${image.id}.jpg`);
                          }}
                          title="Download image"
                          className="absolute top-2 right-2 p-2 bg-white rounded-full hover:bg-gray-200 transition-colors shadow-lg"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
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

      {/* Step 1: Project Selection */}
      {showProjectSelection ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Select a Project</h2>
          </div>

          {projects.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No projects found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelection(project.id)}
                  className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Project ID: {project.id}</p>
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
      ) : (
        <>
          {/* Step 2: History Display */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600 font-semibold">Project ID: {selectedProject}</p>
            <button
              onClick={handleChangeProject}
              className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
            >
              ← Change Project
            </button>
          </div>

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
                      Rs. {Math.round(cashOutHistory.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0))}
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
                        <p className="text-lg font-bold text-red-600">Rs. {Math.round(record.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
