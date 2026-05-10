import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50">
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center rounded-2xl backdrop-blur-md border border-blue-200/30 dark:border-blue-700/30">
            <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-center text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50/50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 text-red-700 dark:text-red-300 text-sm rounded-r-lg backdrop-blur-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <input
                name="username"
                type="text"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-gray-300/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 placeholder-gray-500 dark:placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 transition-all duration-200"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-gray-300/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 placeholder-gray-500 dark:placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 transition-all duration-200"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-[0.98]"
            >
              Sign in
            </button>
          </div>
          
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
