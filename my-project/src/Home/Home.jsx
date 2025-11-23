import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';
import CashIn from '../Form_Cashinout/Cash_in.jsx';
import CashOut from '../Form_Cashinout/Cash_out.jsx';
import CashOutHistory from '../Form_Cashinout/CashOutHistory.jsx';
import CashHistory from '../Form_Cashinout/Cash_history.jsx';
import Accounts from '../Accounts/Accounts.jsx';

export default function Home() {
  const { auth } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTab, setProjectTab] = useState('cash-in');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

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

    const fetchTotalBalance = async () => {
      try {
        // Fetch all cash in history to calculate total
        const response = await axiosInstance.get('cashin/history/all/');
        // Balance calculation is handled in other components
        console.log('Balance data:', response.data);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    if (auth?.accessToken) {
      fetchProjects();
      fetchTotalBalance();
    }
  }, [auth?.accessToken, selectedProject, refreshHistoryTrigger]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const response = await axiosInstance.post('create/project/', {
        name: newProjectName,
      });
      setProjects([...projects, response.data]);
      setNewProjectName('');
      setShowAddProject(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password');
      return;
    }

    try {
      await axiosInstance.delete(`delete/project/${projectId}/`, {
        data: { password: deletePassword },
      });
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(projects[0] || null);
      }
      setDeleteConfirm(null);
      setDeletePassword('');
      setDeleteError('');
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Failed to delete project');
      console.error('Failed to delete project:', err);
    }
  };

  if (!auth?.user) {
    return null;
  }

  return (
    <>
      {/* Projects Modal */}
      {showProjectsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
              <button
                onClick={() => {
                  setShowProjectsModal(false);
                  setShowAddProject(false);
                  setNewProjectName('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Create New Project Section */}
              {!showAddProject ? (
                <button
                  onClick={() => setShowAddProject(true)}
                  className="w-full mb-6 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <span>+</span>
                  <span>New Project</span>
                </button>
              ) : (
                <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Project</h3>
                  <form onSubmit={handleAddProject} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Enter project name"
                        className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold transition-colors"
                      >
                        Create Project
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddProject(false);
                          setNewProjectName('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Projects List */}
              {projects.length > 0 && (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedProject(project);
                        setProjectTab('cash-out');
                        setShowProjectsModal(false);
                        setShowAddProject(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2m0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{project.name}</p>
                            <p className="text-sm text-gray-500">No description</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(project);
                                setProjectTab('cash-out');
                                setShowProjectsModal(false);
                              }}
                              className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold mt-2"
                            >
                              Add Cash Out →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Deletion</h2>
            <p className="text-gray-600 mb-4">Enter yes to delete this project:</p>
            
            {deleteError && (
              <p className="text-red-500 mb-3 p-2 bg-red-100 rounded text-sm">{deleteError}</p>
            )}
            
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter yes to confirm"
              className="w-full border p-3 rounded-lg mb-4 text-sm focus:outline-none focus:border-red-500"
              onKeyPress={(e) => e.key === 'Enter' && handleDeleteProject(deleteConfirm)}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                $
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Cash Manager</h1>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.reload();
              }}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-semibold"
            >
              <span></span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8">
          {selectedProject ? (
            <div className="space-y-8">
              {/* Current Project Display */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2m0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Current Project</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedProject.name}</p>
                  </div>
                </div>
              </div>

              {/* Projects Button */}
              <button
                onClick={() => setShowProjectsModal(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2m0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                </svg>
                <span>Projects</span>
              </button>

              {/* Menu Items */}
              <div className="space-y-4 max-w-2xl mx-auto hidden md:block">
                <button
                  onClick={() => setProjectTab('cash-out')}
                  className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                    projectTab === 'cash-out'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Cash Out</span>
                </button>

                <button
                  onClick={() => setProjectTab('cash-in')}
                  className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                    projectTab === 'cash-in'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>Cash In</span>
                </button>

                <button
                  onClick={() => setProjectTab('cashout-history')}
                  className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                    projectTab === 'cashout-history'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Cash Out History</span>
                </button>

                <button
                  onClick={() => setProjectTab('cashin-history')}
                  className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                    projectTab === 'cashin-history'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Cash In History</span>
                </button>

                <button
                  onClick={() => setProjectTab('accounts')}
                  className="w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Accounts</span>
                </button>
              </div>

              {/* Mobile Menu Toggle Button */}
              <div className="md:hidden flex justify-center">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
              </div>

              {/* Mobile Menu Items */}
              {showMobileMenu && (
                <div className="md:hidden space-y-3 max-w-2xl mx-auto">
                  <button
                    onClick={() => {
                      setProjectTab('cash-out');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                      projectTab === 'cash-out'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>Cash Out</span>
                  </button>

                  <button
                    onClick={() => {
                      setProjectTab('cash-in');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                      projectTab === 'cash-in'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>Cash In</span>
                  </button>

                  <button
                    onClick={() => {
                      setProjectTab('cashout-history');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                      projectTab === 'cashout-history'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Cash Out History</span>
                  </button>

                  <button
                    onClick={() => {
                      setProjectTab('cashin-history');
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 ${
                      projectTab === 'cashin-history'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Cash In History</span>
                  </button>

                  <button
                    onClick={() => {
                      setProjectTab('accounts');
                      setShowMobileMenu(false);
                    }}
                    className="w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-3 bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Accounts</span>
                  </button>
                </div>
              )}

              {/* Content Area */}
              <div className="max-w-2xl mx-auto">
                {projectTab === 'cash-in' && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <CashIn 
                      projectId={selectedProject.id} 
                      onCashInCreated={() => setRefreshHistoryTrigger(prev => prev + 1)}
                    />
                  </div>
                )}
                {projectTab === 'cash-out' && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <CashOut 
                      projectId={selectedProject.id}
                      onCashOutCreated={() => setRefreshHistoryTrigger(prev => prev + 1)}
                    />
                  </div>
                )}
                {projectTab === 'cashout-history' && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <CashOutHistory 
                      projectId={selectedProject.id}
                      refreshTrigger={refreshHistoryTrigger}
                    />
                  </div>
                )}
                {projectTab === 'cashin-history' && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <CashHistory 
                      projectId={selectedProject.id} 
                      refreshTrigger={refreshHistoryTrigger}
                    />
                  </div>
                )}
                {projectTab === 'accounts' && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <Accounts />
                  </div>
                )}
                {projectTab === 'history' && (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <CashHistory 
                      projectId={selectedProject.id} 
                      refreshTrigger={refreshHistoryTrigger}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto">
              <p className="text-gray-500 text-lg">No projects available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
