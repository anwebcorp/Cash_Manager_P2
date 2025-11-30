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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setFetchError('');
        const response = await axiosInstance.get('list/projects/');
        setProjects(response.data);
        if (response.data.length > 0 && !selectedProject) {
          setSelectedProject(response.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setFetchError('Unable to load projects. Server may be down.');
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
      setFetchError('');
    } catch (err) {
      console.error('Failed to create project:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to create project. Please try again.';
      setFetchError(errorMsg);
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
          {selectedProject || showAddProject ? (
            <div className="space-y-8">
              {/* Projects Horizontal Scroll Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-lg font-bold text-gray-900">Projects</h3>
                  {!showAddProject && (
                    <button
                      onClick={() => setShowAddProject(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center space-x-2 text-sm"
                    >
                      <span>+</span>
                      <span>New</span>
                    </button>
                  )}
                </div>

                {fetchError && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                    {fetchError}
                  </div>
                )}

                {/* Create New Project Form */}
                {showAddProject && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Project</h3>
                    <form onSubmit={handleAddProject} className="space-y-4">
                      {fetchError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                          {fetchError}
                        </div>
                      )}
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
                          Create Projects
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddProject(false);
                            setNewProjectName('');
                            setFetchError('');
                          }}
                          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Horizontal Scrollable Projects */}
                {projects.length > 0 && (
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-3 md:gap-4" style={{ minWidth: 'min-content' }}>
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => {
                            setSelectedProject(project);
                            setProjectTab('cash-out');
                          }}
                          className={`flex-shrink-0 w-40 h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-2xl p-4 md:p-5 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg ${
                            selectedProject?.id === project.id
                              ? 'bg-emerald-500 text-white shadow-lg'
                              : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-emerald-500'
                          }`}
                        >
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <div className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center mb-2 md:mb-4 ${
                                selectedProject?.id === project.id
                                  ? 'bg-emerald-600'
                                  : 'bg-emerald-100'
                              }`}>
                                <svg className={`w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ${selectedProject?.id === project.id ? 'text-white' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2m0 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v2" />
                                </svg>
                              </div>
                              <p className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2 truncate">{project.name}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(project);
                                setProjectTab('cash-out');
                              }}
                              className={`text-xs md:text-sm font-semibold mt-2 md:mt-4 transition-colors ${
                                selectedProject?.id === project.id
                                  ? 'text-emerald-100 hover:text-white'
                                  : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                            >
                              Add Cash Out →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Items for MD screens */}
              <div className="space-y-4 max-w-2xl mx-auto hidden md:block lg:hidden">
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

              {/* Desktop Layout - 30% Left 70% Right */}
              <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8 mt-12">
                {/* Left Sidebar - 30% */}
                <div className="lg:col-span-1">
                  <div className="space-y-3 sticky top-8">
                    <h3 className="text-lg font-bold text-gray-900 px-2">Actions</h3>
                    
                    <button
                      onClick={() => setProjectTab('cash-out')}
                      className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                        projectTab === 'cash-out'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span>Cash Out</span>
                    </button>

                    <button
                      onClick={() => setProjectTab('cash-in')}
                      className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                        projectTab === 'cash-in'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span>Cash In</span>
                    </button>

                    <button
                      onClick={() => setProjectTab('cashout-history')}
                      className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                        projectTab === 'cashout-history'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Cash Out History</span>
                    </button>

                    <button
                      onClick={() => setProjectTab('cashin-history')}
                      className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                        projectTab === 'cashin-history'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Cash In History</span>
                    </button>

                    <button
                      onClick={() => setProjectTab('accounts')}
                      className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                        projectTab === 'accounts'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Accounts</span>
                    </button>
                  </div>
                </div>

                {/* Right Content Area - 70% */}
                <div className="lg:col-span-2">
                  {selectedProject ? (
                    <>
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
                    </>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                      <p className="text-gray-500">Loading projects...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Menu Items for MD screens */}
              <div className="space-y-4 max-w-2xl mx-auto hidden md:block lg:hidden">
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

              {/* Content Area for MD screens */}
              <div className="max-w-2xl mx-auto lg:hidden">
                {selectedProject ? (
                  <>
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
                  </>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                    <p className="text-gray-500">Loading projects...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-2xl mx-auto">
              <p className="text-gray-500 text-lg mb-6">No projects available</p>
              <button
                onClick={() => setShowAddProject(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Your First Project</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
