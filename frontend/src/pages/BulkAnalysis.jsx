import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, ImageIcon, CheckCircle2, AlertTriangle, 
  Search, Filter, LayoutGrid, List, PieChart as PieIcon,
  ChevronRight, X, Loader2, Download, Info, ArrowUpRight, ScanFace
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';

const COLORS = ['#10b981', '#ef4444']; // Green for Real, Red for Fake

const BulkAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, REAL, FAKE
  const [selectedImage, setSelectedImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const startAnalysis = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    setResults(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/bulk-predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      setResults(response.data.results);
      setSummary(response.data.summary);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during bulk analysis.');
    } finally {
      setUploading(false);
    }
  };

  const filteredResults = results ? results.filter(r => {
    if (filter === 'ALL') return true;
    return r.prediction === filter;
  }) : [];

  const pieData = summary ? [
    { name: 'Real', value: summary.real_count },
    { name: 'Fake', value: summary.fake_count }
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bulk <span className="text-indigo-600 dark:text-indigo-400">Analysis</span>
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
            Process batches of images or extract from PDF/DOCX for deep authenticity checks.
          </p>
        </div>
        {results && (
          <button 
            onClick={() => { setResults(null); setSummary(null); setFiles([]); }}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Upload size={18} /> New Analysis
          </button>
        )}
      </div>

      {!results && !uploading ? (
        /* ── Upload Section ── */
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <div 
              onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-12 md:p-20
                ${dragActive 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[0.99]' 
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 hover:border-indigo-400 dark:hover:border-indigo-500/50'
                }`}
            >
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Upload size={36} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Drop files here
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
                Upload multiple images, or a PDF/DOCX file. We'll automatically extract and analyze every image found.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <ImageIcon size={20} /> Select Images
                </button>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                  <FileText size={20} /> Select Documents
                </button>
              </div>
              
              <input 
                type="file" multiple ref={fileInputRef} className="hidden" 
                accept="image/*,.pdf,.docx" onChange={handleFileChange} 
              />
            </div>

            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Selected Files <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full">{files.length}</span>
                  </h4>
                  <button onClick={startAnalysis} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                    Process All →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {files.slice(0, 8).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                        {f.type.includes('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{f.name}</span>
                    </div>
                  ))}
                  {files.length > 8 && (
                    <div className="p-3 text-center text-sm font-bold text-slate-400 italic">
                      + {files.length - 8} more files...
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : uploading ? (
        /* ── Loading Section ── */
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ScanFace size={32} className="text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Batch...</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            We are extracting images and running our CNN analysis with explainable Grad-CAM. This may take a moment depending on the batch size.
          </p>
        </div>
      ) : (
        /* ── Results Dashboard ── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            {/* Stats Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Images</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white">{summary.total}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 border-l-4 border-l-emerald-500 shadow-sm">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Real Detected</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{summary.real_count}</p>
                  <p className="text-lg font-bold text-emerald-500 mb-1">{summary.real_percent}%</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 border-l-4 border-l-red-500 shadow-sm">
                <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Fake Detected</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{summary.fake_count}</p>
                  <p className="text-lg font-bold text-red-500 mb-1">{summary.fake_percent}%</p>
                </div>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-[200px] lg:h-auto min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} 
                    paddingAngle={8} dataKey="value" stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filtering & Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl w-fit">
                {['ALL', 'REAL', 'FAKE'].map(t => (
                  <button
                    key={t} onClick={() => setFilter(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                      ${filter === t 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()} 
                    <span className="ml-2 opacity-50">{t === 'ALL' ? summary.total : t === 'REAL' ? summary.real_count : summary.fake_count}</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Search filenames..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                />
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredResults.map((res, i) => (
                  <motion.div
                    key={i} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedImage(res)}
                    className="group cursor-pointer bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-200 dark:bg-slate-700">
                      <img src={res.thumbnail_base64} alt={res.filename} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm
                        ${res.prediction === 'REAL' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        {res.prediction}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-1">{res.filename}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">{res.confidence.toFixed(1)}% Conf.</span>
                        <ChevronRight size={12} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner
                    ${selectedImage.prediction === 'REAL' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                    {selectedImage.prediction === 'REAL' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Analysis Details</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] md:max-w-md">{selectedImage.filename}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Visuals */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-100 dark:border-slate-800 shadow-inner">
                      <img 
                        src={`data:image/png;base64,${selectedImage.gradcam_base64}`} 
                        alt="Grad-CAM Visualization" 
                        className="w-full rounded-xl shadow-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prediction</p>
                        <p className={`text-xl font-black ${selectedImage.prediction === 'REAL' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {selectedImage.prediction}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                          {selectedImage.confidence.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Explainability */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Explainable Insights</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedImage.explanation_points.map((p, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="mt-1 flex-shrink-0">
                            <Info size={14} className="text-indigo-500" />
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                        </div>
                      ))}
                    </div>

                    <div className={`p-5 rounded-2xl flex items-center gap-4
                      ${selectedImage.risk_level.includes('High') ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40' : 
                        selectedImage.risk_level.includes('Medium') ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40' : 
                        'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${selectedImage.risk_level.includes('High') ? 'bg-red-500 text-white' : 
                          selectedImage.risk_level.includes('Medium') ? 'bg-amber-500 text-white' : 
                          'bg-emerald-500 text-white'}`}>
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Risk Level</p>
                        <p className="text-lg font-black">{selectedImage.risk_level}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 flex-shrink-0">
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="px-6 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default BulkAnalysis;
