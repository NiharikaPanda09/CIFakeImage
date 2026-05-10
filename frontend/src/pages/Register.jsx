import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(username, password);
      await login(username, password); // Auto login after registration
      navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50">
        <div>
          <div className="mx-auto h-16 w-16 bg-green-100/50 dark:bg-green-900/30 flex items-center justify-center rounded-2xl backdrop-blur-md border border-green-200/30 dark:border-green-700/30">
            <UserPlus className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mt-6 text-center text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Create an account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50/50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 text-red-700 dark:text-red-300 text-sm rounded-r-lg backdrop-blur-sm">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                name="username"
                type="text"
                required
                className="appearance-none rounded-t-xl relative block w-full px-4 py-4 border border-gray-300/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 placeholder-gray-500 dark:placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:z-10 transition-all duration-200"
                placeholder="Choose a Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-b-xl relative block w-full px-4 py-4 border border-t-0 border-gray-300/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 placeholder-gray-500 dark:placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:z-10 transition-all duration-200"
                placeholder="Choose a Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-500/30 transition-all duration-200 active:scale-[0.98]"
            >
              Register
            </button>
          </div>
          
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-green-600 dark:text-green-400 hover:text-green-500 transition-colors">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
