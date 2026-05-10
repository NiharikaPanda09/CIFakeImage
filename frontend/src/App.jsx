import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Results from './pages/Results';
import HistoryDashboard from './pages/HistoryDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Compare from './pages/Compare';
import Analytics from './pages/Analytics';
import FaceAnalysis from './pages/FaceAnalysis';
import BulkAnalysis from './pages/BulkAnalysis';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import axios from 'axios';

// Set global axios defaults
axios.defaults.withCredentials = true;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <React.Fragment>{window.location.replace('/login')}</React.Fragment>;
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 flex flex-col transition-colors duration-300">
            <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryDashboard /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/deepfake" element={<ProtectedRoute><FaceAnalysis /></ProtectedRoute>} />
              <Route path="/bulk-analysis" element={<ProtectedRoute><BulkAnalysis /></ProtectedRoute>} />
            </Routes>
          </main>
        
        <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-auto transition-colors duration-300">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              CIFAKE - Explainable Identification of AI-Generated Synthetic Images.
            </p>
          </div>
        </footer>
      </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
