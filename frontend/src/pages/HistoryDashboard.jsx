import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Image as ImageIcon, AlertCircle, Filter, X } from 'lucide-react';
import axios from 'axios';

const HistoryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/history', { withCredentials: true });
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        const msg = err.response?.status === 401
          ? 'You must be logged in to view history.'
          : 'Failed to load history data. Ensure MongoDB and the backend are running.';
        setError(msg);
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex">
          <AlertCircle className="text-red-500 mr-3 shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const { history, analytics } = data || { history: [], analytics: { total: 0, real_count: 0, fake_count: 0 } };

  const filteredHistory = filter === 'ALL' 
    ? history 
    : history.filter(r => r.prediction.toUpperCase() === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 py-12"
    >
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
            <Activity className="mr-3 text-blue-600 dark:text-blue-400" size={32} />
            Prediction History
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Review your past scans and filter results.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Clock className="mr-2 text-gray-500 dark:text-gray-400" size={20} />
            Recent Predictions
          </h3>
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500 dark:text-gray-400" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
              <option value="ALL">All Predictions</option>
              <option value="REAL">Real Images</option>
              <option value="FAKE">Fake Images</option>
            </select>
          </div>
        </div>
        
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No history records found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thumbnail</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filename</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prediction</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confidence</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredHistory.map((record, index) => {
                  const date = new Date(record.timestamp);
                  const isReal = record.prediction.toUpperCase() === 'REAL';
                  
                  return (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center overflow-hidden">
                          {record.thumbnail_base64 ? (
                            <img src={record.thumbnail_base64} alt="Thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-400 dark:text-gray-500 w-6 h-6" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {record.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isReal ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'}`}>
                          {record.prediction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.confidence.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {date.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-4 ${selectedRecord.prediction === 'FAKE' ? 'bg-red-600' : 'bg-green-600'} text-white flex justify-between items-center`}>
                <h3 className="font-bold text-lg">Result Details</h3>
                <button onClick={() => setSelectedRecord(null)} className="p-1 hover:bg-white/20 rounded-full transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex justify-center mb-6">
                  <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
                    {selectedRecord.thumbnail_base64 ? (
                      <img src={selectedRecord.thumbnail_base64} alt="Record Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Filename</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{selectedRecord.filename}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Prediction</span>
                    <span className={`font-bold ${selectedRecord.prediction === 'FAKE' ? 'text-red-500' : 'text-green-500'}`}>
                      {selectedRecord.prediction}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Confidence</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRecord.confidence.toFixed(2)}%</span>
                  </div>
                   <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">{new Date(selectedRecord.timestamp).toLocaleString()}</span>
                  </div>
                  {selectedRecord.face_detected && selectedRecord.face_analysis && (
                    <div className="flex justify-between pb-2">
                      <span className="text-gray-500 dark:text-gray-400">Face Analysis</span>
                      <span className={`font-bold ${
                        selectedRecord.face_analysis.status === 'No Issue' ? 'text-green-500' : 
                        (selectedRecord.face_analysis.status === 'Suspicious' ? 'text-amber-500' : 'text-red-500')
                      }`}>
                        {selectedRecord.face_analysis.status}
                      </span>
                    </div>
                  )}
                  {!selectedRecord.face_detected && (
                    <div className="flex justify-between pb-2">
                      <span className="text-gray-500 dark:text-gray-400">Face Analysis</span>
                      <span className="text-gray-400 italic text-sm">No Face Detected</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HistoryDashboard;
