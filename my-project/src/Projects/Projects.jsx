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
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('list/projects/');
      setProjects(response.data);
    } catch (err) {
      setError('Failed to fetch projects');
      console.error(err);
    } finally {
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

      setSuccess('Project created successfully!');
      setFormData({ name: '' });
      setShowForm(false);
      fetchProjects(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create project');
      console.error('Project creation error:', err);
    } finally {
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
      <div className="bg-white rounded-lg shadow p-6">
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

        {/* Project Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveProjectTab('cashin')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeProjectTab === 'cashin'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cash In
          </button>
          <button
            onClick={() => setActiveProjectTab('cashout')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeProjectTab === 'cashout'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cash Out
          </button>
          <button
            onClick={() => setActiveProjectTab('history')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeProjectTab === 'history'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            History
          </button>
        </div>

        {/* Cash In Tab */}
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
                    placeholder="0.00"
                    step="0.01"
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
                    placeholder="0.00"
                    step="0.01"
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
                        <td className="border border-gray-300 p-3 font-semibold text-red-600">${record.amount}</td>
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
    );
  }

  // Projects List View
  return (
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
  );
}
