import { useState, useEffect } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function Projects() {
  const { auth } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState('cashin');
  const [projectCashInHistory, setProjectCashInHistory] = useState([]);
  const [projectCashOutHistory, setProjectCashOutHistory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [projectFormData, setProjectFormData] = useState({
    sr_no: '',
    date: '',
    description: '',
    cash_from: '',
    account: '',
    amount: '',
  });
  const [projectCashOutFormData, setProjectCashOutFormData] = useState({
    sr_no: '',
    date: '',
    description: '',
    account: '',
    amount: '',
  });
  const [projectImages, setProjectImages] = useState([]);
  const [projectSubmitLoading, setProjectSubmitLoading] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    if (auth?.accessToken) {
      fetchProjects();
      fetchAccounts();
    }
  }, [auth?.accessToken]);

  // Fetch project history when a project is selected
  useEffect(() => {
    if (selectedProject && auth?.accessToken) {
      fetchProjectHistory(selectedProject.id);
    }
  }, [selectedProject, auth?.accessToken]);

  const fetchProjects = async () => {
    setError('');
    try {
      const response = await axiosInstance.get('list/projects/');
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error(err);
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axiosInstance.get('view/all/accounts/');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchProjectHistory = async (projectId) => {
    try {
      const [cashInRes, cashOutRes] = await Promise.all([
        axiosInstance.get(`cashin/history/all/`),
        axiosInstance.get(`cashout/history/project/${projectId}/`)
      ]);
      setProjectCashInHistory(cashInRes.data);
      setProjectCashOutHistory(cashOutRes.data);
    } catch (err) {
      console.error('Failed to fetch project history:', err);
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
      await axiosInstance.post('create/project/', {
        name: formData.name,
      });

      setFormData({ name: '' });
      setShowForm(false);
      
      // Fetch updated projects list after creation
      const response = await axiosInstance.get('list/projects/');
      console.log('Projects fetched after creation:', response.data);
      setProjects(response.data);
      setSuccess('Project created successfully!');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create project');
      console.error('Project creation error:', err);
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axiosInstance.delete(`delete/project/${projectId}/`);
        setSuccess('Project deleted successfully!');
        fetchProjects(); // Refresh the list
      } catch (err) {
        setError('Failed to delete project');
        console.error(err);
      }
    }
  };

  const handleProjectInputChange = (e) => {
    const { name, value } = e.target;
    setProjectFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProjectCashOutInputChange = (e) => {
    const { name, value } = e.target;
    setProjectCashOutFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProjectImageChange = (e) => {
    setProjectImages(Array.from(e.target.files));
  };

  const handleProjectCashInSubmit = async (e) => {
    e.preventDefault();
    setProjectSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      form.append('sr_no', projectFormData.sr_no);
      form.append('date', projectFormData.date);
      form.append('description', projectFormData.description);
      form.append('cash_from', projectFormData.cash_from);
      form.append('account', projectFormData.account);
      form.append('amount', projectFormData.amount);

      projectImages.forEach(img => {
        form.append('images', img);
      });

      await axiosInstance.post('cashin/account/', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Cash In recorded successfully!');
      setProjectFormData({
        sr_no: '',
        date: '',
        description: '',
        cash_from: '',
        account: '',
        amount: '',
      });
      setProjectImages([]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit cash in');
      console.error('Cash In error:', err);
    } finally {
      setProjectSubmitLoading(false);
    }
  };

  const handleProjectCashOutSubmit = async (e) => {
    e.preventDefault();
    setProjectSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      form.append('sr_no', projectCashOutFormData.sr_no);
      form.append('date', projectCashOutFormData.date);
      form.append('description', projectCashOutFormData.description);
      form.append('project', selectedProject.id);
      form.append('account', projectCashOutFormData.account);
      form.append('amount', projectCashOutFormData.amount);

      projectImages.forEach(img => {
        form.append('images', img);
      });

      await axiosInstance.post('cashout/create/', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Cash Out recorded successfully!');
      setProjectCashOutFormData({
        sr_no: '',
        date: '',
        description: '',
        account: '',
        amount: '',
      });
      setProjectImages([]);
      fetchProjectHistory(selectedProject.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit cash out');
      console.error('Cash Out error:', err);
    } finally {
      setProjectSubmitLoading(false);
    }
  };

  if (!auth?.user) {
    return null;
  }

  // Project Details View
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Desktop Layout - Left Sidebar + Right Content */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8 px-6 py-8 pt-24">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-3 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 px-2">Projects</h3>
              
              {/* Projects Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-between bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <span className="truncate">{selectedProject.name}</span>
                  <svg className={`w-5 h-5 ml-2 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                
                {showProjectDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProject(project);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-100 ${
                          selectedProject.id === project.id
                            ? 'bg-emerald-50 text-emerald-600 font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <hr className="my-4" />

              {/* Tab Buttons */}
              <button
                onClick={() => setActiveProjectTab('cashin')}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                  activeProjectTab === 'cashin'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>Cash In</span>
              </button>

              <button
                onClick={() => setActiveProjectTab('cashout')}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                  activeProjectTab === 'cashout'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Cash Out</span>
              </button>

              <button
                onClick={() => setActiveProjectTab('history')}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                  activeProjectTab === 'history'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>History</span>
              </button>

              <button
                onClick={() => setSelectedProject(null)}
                className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 bg-gray-500 text-white hover:bg-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h1 className="text-3xl font-bold mb-2">{selectedProject.name}</h1>
              <p className="text-gray-600 mb-6">Project ID: {selectedProject.id}</p>

              {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded">{error}</p>}
              {success && <p className="text-green-500 mb-4 p-3 bg-green-100 rounded">{success}</p>}

              {/* Cash In Tab */}
              {activeProjectTab === 'cashin' && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">Record Cash In</h2>
                  <form onSubmit={handleProjectCashInSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold">Serial Number</label>
                        <input
                          type="text"
                          name="sr_no"
                          value={projectFormData.sr_no}
                          onChange={handleProjectInputChange}
                          className="w-full border p-2 rounded"
                          placeholder="SR-001"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={projectFormData.date}
                          onChange={handleProjectInputChange}
                          className="w-full border p-2 rounded"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Description</label>
                      <textarea
                        name="description"
                        value={projectFormData.description}
                        onChange={handleProjectInputChange}
                        className="w-full border p-2 rounded"
                        placeholder="Enter description"
                        rows="2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Cash From</label>
                      <input
                        type="text"
                        name="cash_from"
                        value={projectFormData.cash_from}
                        onChange={handleProjectInputChange}
                        className="w-full border p-2 rounded"
                        placeholder="Source of cash"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold">Select Account</label>
                        <select
                          name="account"
                          value={projectFormData.account}
                          onChange={handleProjectInputChange}
                          className="w-full border p-2 rounded"
                          required
                        >
                          <option value="">-- Select Account --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold">Amount</label>
                        <input
                          type="number"
                          name="amount"
                          value={projectFormData.amount}
                          onChange={handleProjectInputChange}
                          className="w-full border p-2 rounded"
                          placeholder="0"
                          step="1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Bill Images</label>
                      <input
                        type="file"
                        multiple
                        onChange={handleProjectImageChange}
                        className="w-full border p-2 rounded"
                        accept="image/*"
                      />
                      {projectImages.length > 0 && (
                        <p className="mt-2 text-sm text-gray-600">{projectImages.length} image(s) selected</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={projectSubmitLoading}
                      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      {projectSubmitLoading ? 'Submitting...' : 'Submit Cash In'}
                    </button>
                  </form>
                </div>
              )}

              {/* Cash Out Tab */}
              {activeProjectTab === 'cashout' && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">Record Cash Out</h2>
                  <form onSubmit={handleProjectCashOutSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold">Serial Number</label>
                        <input
                          type="text"
                          name="sr_no"
                          value={projectCashOutFormData.sr_no}
                          onChange={handleProjectCashOutInputChange}
                          className="w-full border p-2 rounded"
                          placeholder="SR-001"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={projectCashOutFormData.date}
                          onChange={handleProjectCashOutInputChange}
                          className="w-full border p-2 rounded"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Description</label>
                      <textarea
                        name="description"
                        value={projectCashOutFormData.description}
                        onChange={handleProjectCashOutInputChange}
                        className="w-full border p-2 rounded"
                        placeholder="Enter description"
                        rows="2"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-semibold">Select Account</label>
                        <select
                          name="account"
                          value={projectCashOutFormData.account}
                          onChange={handleProjectCashOutInputChange}
                          className="w-full border p-2 rounded"
                          required
                        >
                          <option value="">-- Select Account --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold">Amount</label>
                        <input
                          type="number"
                          name="amount"
                          value={projectCashOutFormData.amount}
                          onChange={handleProjectCashOutInputChange}
                          className="w-full border p-2 rounded"
                          placeholder="0"
                          step="1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold">Bill Images</label>
                      <input
                        type="file"
                        multiple
                        onChange={handleProjectImageChange}
                        className="w-full border p-2 rounded"
                        accept="image/*"
                      />
                      {projectImages.length > 0 && (
                        <p className="mt-2 text-sm text-gray-600">{projectImages.length} image(s) selected</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={projectSubmitLoading}
                      className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
                    >
                      {projectSubmitLoading ? 'Submitting...' : 'Submit Cash Out'}
                    </button>
                  </form>
                </div>
              )}

              {/* History Tab */}
              {activeProjectTab === 'history' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Project History</h2>
                  
                  {projectCashOutHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-gray-300 p-3 text-left">SR No</th>
                            <th className="border border-gray-300 p-3 text-left">Date</th>
                            <th className="border border-gray-300 p-3 text-left">Type</th>
                            <th className="border border-gray-300 p-3 text-left">Account</th>
                            <th className="border border-gray-300 p-3 text-left">Amount</th>
                            <th className="border border-gray-300 p-3 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectCashOutHistory.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3">{record.sr_no}</td>
                              <td className="border border-gray-300 p-3">{record.date}</td>
                              <td className="border border-gray-300 p-3">
                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">Cash Out</span>
                              </td>
                              <td className="border border-gray-300 p-3">{record.account_name || `Account #${record.account}`}</td>
                              <td className="border border-gray-300 p-3 font-semibold text-red-600">Rs. {record.amount}</td>
                              <td className="border border-gray-300 p-3 text-sm">{record.description?.substring(0, 50) || 'N/A'}...</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600">No transactions found for this project</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile & Tablet View */}
        <div className="lg:hidden px-6 py-8 pt-24">
          <button
            onClick={() => setSelectedProject(null)}
            className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            ← Back to Projects
          </button>

          <h1 className="text-3xl font-bold mb-2">{selectedProject.name}</h1>
          <p className="text-gray-600 mb-6">Project ID: {selectedProject.id}</p>

          {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded">{error}</p>}
          {success && <p className="text-green-500 mb-4 p-3 bg-green-100 rounded">{success}</p>}

          {/* Project Tabs for Mobile */}
          <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveProjectTab('cashin')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeProjectTab === 'cashin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Cash In
            </button>
            <button
              onClick={() => setActiveProjectTab('cashout')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeProjectTab === 'cashout'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Cash Out
            </button>
            <button
              onClick={() => setActiveProjectTab('history')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeProjectTab === 'history'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              History
            </button>
          </div>

          {/* Cash In Tab Mobile */}
          {activeProjectTab === 'cashin' && (
            <div className="bg-gray-50 p-4 rounded mb-6">
              <h2 className="text-xl font-bold mb-4">Record Cash In</h2>
              <form onSubmit={handleProjectCashInSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold">Serial Number</label>
                    <input
                      type="text"
                      name="sr_no"
                      value={projectFormData.sr_no}
                      onChange={handleProjectInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="SR-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={projectFormData.date}
                      onChange={handleProjectInputChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Description</label>
                  <textarea
                    name="description"
                    value={projectFormData.description}
                    onChange={handleProjectInputChange}
                    className="w-full border p-2 rounded"
                    placeholder="Enter description"
                    rows="2"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Cash From</label>
                  <input
                    type="text"
                    name="cash_from"
                    value={projectFormData.cash_from}
                    onChange={handleProjectInputChange}
                    className="w-full border p-2 rounded"
                    placeholder="Source of cash"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold">Select Account</label>
                    <select
                      name="account"
                      value={projectFormData.account}
                      onChange={handleProjectInputChange}
                      className="w-full border p-2 rounded"
                      required
                    >
                      <option value="">-- Select Account --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={projectFormData.amount}
                      onChange={handleProjectInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="0"
                      step="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Bill Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleProjectImageChange}
                    className="w-full border p-2 rounded"
                    accept="image/*"
                  />
                  {projectImages.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">{projectImages.length} image(s) selected</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={projectSubmitLoading}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {projectSubmitLoading ? 'Submitting...' : 'Submit Cash In'}
                </button>
              </form>
            </div>
          )}

          {/* Cash Out Tab Mobile */}
          {activeProjectTab === 'cashout' && (
            <div className="bg-gray-50 p-4 rounded mb-6">
              <h2 className="text-xl font-bold mb-4">Record Cash Out</h2>
              <form onSubmit={handleProjectCashOutSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold">Serial Number</label>
                    <input
                      type="text"
                      name="sr_no"
                      value={projectCashOutFormData.sr_no}
                      onChange={handleProjectCashOutInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="SR-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={projectCashOutFormData.date}
                      onChange={handleProjectCashOutInputChange}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Description</label>
                  <textarea
                    name="description"
                    value={projectCashOutFormData.description}
                    onChange={handleProjectCashOutInputChange}
                    className="w-full border p-2 rounded"
                    placeholder="Enter description"
                    rows="2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 font-semibold">Select Account</label>
                    <select
                      name="account"
                      value={projectCashOutFormData.account}
                      onChange={handleProjectCashOutInputChange}
                      className="w-full border p-2 rounded"
                      required
                    >
                      <option value="">-- Select Account --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={projectCashOutFormData.amount}
                      onChange={handleProjectCashOutInputChange}
                      className="w-full border p-2 rounded"
                      placeholder="0"
                      step="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-semibold">Bill Images</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleProjectImageChange}
                    className="w-full border p-2 rounded"
                    accept="image/*"
                  />
                  {projectImages.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">{projectImages.length} image(s) selected</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={projectSubmitLoading}
                  className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
                >
                  {projectSubmitLoading ? 'Submitting...' : 'Submit Cash Out'}
                </button>
              </form>
            </div>
          )}

          {/* History Tab Mobile */}
          {activeProjectTab === 'history' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Project History</h2>
              
              {projectCashOutHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left">SR No</th>
                        <th className="border border-gray-300 p-3 text-left">Date</th>
                        <th className="border border-gray-300 p-3 text-left">Type</th>
                        <th className="border border-gray-300 p-3 text-left">Account</th>
                        <th className="border border-gray-300 p-3 text-left">Amount</th>
                        <th className="border border-gray-300 p-3 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectCashOutHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">{record.sr_no}</td>
                          <td className="border border-gray-300 p-3">{record.date}</td>
                          <td className="border border-gray-300 p-3">
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm">Cash Out</span>
                          </td>
                          <td className="border border-gray-300 p-3">{record.account_name || `Account #${record.account}`}</td>
                          <td className="border border-gray-300 p-3 font-semibold text-red-600">Rs. {record.amount}</td>
                          <td className="border border-gray-300 p-3 text-sm">{record.description?.substring(0, 50) || 'N/A'}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-600">No transactions found for this project</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8 px-6 py-8 pt-24">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-3 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 px-2">Projects</h3>
            
            {/* Projects Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-between bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <span>Select Project</span>
                <svg className={`w-5 h-5 ml-2 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              
              {showProjectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {projects.length > 0 ? (
                    projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProject(project);
                          setShowProjectDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-emerald-50 text-gray-700 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No projects found</div>
                  )}
                </div>
              )}
            </div>

            <hr className="my-4" />

            {/* Create New Project Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className={`w-full px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-start space-x-2 ${
                showForm
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded">{error}</p>}
            {success && <p className="text-green-500 mb-4 p-3 bg-green-100 rounded">{success}</p>}

            {/* Create Project Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h2 className="text-xl font-bold mb-4">Create New Project</h2>
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-semibold"
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ name: '' });
                      setError('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Projects Info */}
            {!showForm && (
              <div>
                <h2 className="text-2xl font-bold mb-4">All Projects</h2>
                <p className="text-gray-600 mb-6">Total Projects: <span className="font-bold text-lg text-emerald-600">{projects.length}</span></p>

                {loading ? (
                  <p className="text-center text-gray-600 py-8">Loading...</p>
                ) : projects.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <p className="text-gray-500 mb-4">No projects found. Create your first project!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div key={project.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900">{project.name}</h3>
                            <p className="text-sm text-gray-500">Created: {new Date(project.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedProject(project)}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 font-semibold transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile & Tablet View */}
      <div className="lg:hidden px-6 py-8 pt-24">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Projects</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {showForm ? 'Cancel' : '+ New Project'}
            </button>
          </div>

          {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded">{error}</p>}
          {success && <p className="text-green-500 mb-4 p-3 bg-green-100 rounded">{success}</p>}

          {/* Create Project Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Project Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          )}

          {/* Projects List */}
          {loading && !showForm ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : projects.length === 0 ? (
            <p className="text-center text-gray-600">No projects found. Create your first project!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-3 text-left">ID</th>
                    <th className="border border-gray-300 p-3 text-left">Project Name</th>
                    <th className="border border-gray-300 p-3 text-left">Created At</th>
                    <th className="border border-gray-300 p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3">{project.id}</td>
                      <td className="border border-gray-300 p-3 font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => setSelectedProject(project)}>
                        {project.name}
                      </td>
                      <td className="border border-gray-300 p-3 text-sm text-gray-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 p-3 flex gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <p>Total Projects: {projects.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
