import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path 
      ? "bg-blue-600 text-white shadow-md" 
      : "text-slate-600 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/5 dark:bg-black/5 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              <span className="ml-2 text-slate-900 dark:text-white font-bold text-xl tracking-tight">CIFAKE Explainer</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}>
                  Home
                </Link>
                <Link to="/upload" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/upload')}`}>
                  Analyze Image
                </Link>
                <Link to="/history" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/history')}`}>
                  History
                </Link>
                <Link to="/deepfake" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/deepfake')}`}>
                  Deepfake Detect
                </Link>
                {user && (
                  <>
                    <Link to="/compare" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/compare')}`}>
                      Compare
                    </Link>
                    <Link to="/analytics" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/analytics')}`}>
                      Analytics
                    </Link>
                    <Link to="/bulk-analysis" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/bulk-analysis')}`}>
                      Bulk Analysis
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-slate-500 dark:text-blue-200 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {user ? (
              <>
                <div className="flex items-center text-slate-700 dark:text-blue-100">
                  <User className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-slate-600 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-blue-50 dark:hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 dark:text-blue-100 hover:text-blue-600 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-blue-50 dark:hover:bg-white/10">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
