import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WrongLogin() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(15);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          navigate('/login');
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRedirect, navigate]);

  const handleBack = () => {
    setAutoRedirect(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl">✕</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login Failed</h1>
          <p className="text-gray-600 mb-8">Invalid username or password</p>

          <div className="space-y-4 mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 font-semibold text-left">
                <span className="block mb-2">Possible Issues:</span>
                <span className="block text-sm font-normal">• Wrong username</span>
                <span className="block text-sm font-normal">• Wrong password</span>
                <span className="block text-sm font-normal">• Account not activated</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleBack}
            className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition duration-200 font-semibold mb-4"
          >
            Back to Login
          </button>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-gray-700 text-sm mb-2">Need help?</p>
            <p className="text-gray-600 text-sm">
              Contact developer support:
            </p>
            <a
              href="mailto:anwebco@gmail.com"
              className="text-emerald-500 font-semibold hover:text-emerald-600 transition"
            >
              anwebco@gmail.com
            </a>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Redirecting to login in <span className="font-bold text-emerald-500">{timeLeft}</span>s
            </p>
            <p className="text-gray-500 text-xs mt-2">Press "Back to Login" to return now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
