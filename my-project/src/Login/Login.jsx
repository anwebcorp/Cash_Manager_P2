import { useState } from 'react';
import useAuth from '../Axioss/useAuth.jsx';
import axiosInstance from '../Axioss/axiosInstance.jsx';

export default function Login() {
  const { auth, setAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axiosInstance.post('login/', {
        username,
        password,
      });

      const { access, refresh, user } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      setAuth({
        user,
        accessToken: access,
        refreshToken: refresh,
      });

      setSuccess(`Login successful! Welcome ${user.username}`);
      setUsername('');
      setPassword('');
    } catch (err) {
      // Show user-friendly message for wrong credentials
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Invalid username or password');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAuth({ user: null, accessToken: null, refreshToken: null });
    setSuccess('Logged out');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {auth?.user ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">✓</span>
            </div>
            <p className="text-green-600 font-semibold mb-6 text-lg">Connected & Logged In</p>
            <div className="text-left space-y-3 mb-6">
              <p className="text-gray-700"><strong>User:</strong> <span className="text-gray-600">{auth.user.username}</span></p>
              <p className="text-gray-700"><strong>Email:</strong> <span className="text-gray-600">{auth.user.email}</span></p>
              <p className="text-gray-700"><strong>Token:</strong> <span className="text-gray-600 text-sm">{auth.accessToken?.substring(0, 20)}...</span></p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition duration-200 font-semibold"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">$</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Cash Manager</h1>
              <p className="text-gray-600 text-lg">Sign in to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                  placeholder=" "
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 disabled:bg-gray-400 transition duration-200 font-semibold text-lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
