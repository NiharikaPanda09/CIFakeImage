import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, Upload as UploadIcon, AlertCircle, Loader2, 
  ShieldCheck, Brain, Eye, Info, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FaceAnalysis = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [result, setResult]         = useState(null);
  
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const processFile = (f) => {
    setError(null);
    setResult(null);
    if (!f.type.match('image.*')) { setError('Please upload an image file.'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('use_case', 'general');
    formData.append('source', 'deepfake'); // Tag this as a deepfake scan, not general analysis

    try {
      const response = await axios.post('http://localhost:5000/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (!response.data.face_detected) {
        setError("No human face detected in this image. Deepfake analysis requires a clear facial subject.");
        setLoading(false);
        return;
      }

      setResult({
        ...response.data,
        gradcam_base64: `data:image/png;base64,${response.data.gradcam_base64}`
      });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during analysis.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-12"
    >
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
          <ShieldCheck size={14} /> Advanced Forensic Module
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Deepfake Face Detector
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Specialized AI analysis for detecting facial manipulation, blending artifacts, and inconsistent skin textures in portrait imagery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Upload Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center
                ${dragActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50'}
                ${!preview ? 'p-16' : 'p-6'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
              {!preview ? (
                <>
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-6">
                    <UploadIcon className="text-indigo-500" size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Drop portrait here</p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    or browse files
                  </button>
                  <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                </>
              ) : (
                <div className="w-full space-y-6">
                  <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white dark:ring-slate-700">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => { setFile(null); setPreview(null); setResult(null); setError(null); }}
                      className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-10 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {loading ? <><Loader2 className="animate-spin" size={20} /> Analyzing...</> : 'Scan Face'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                {error}
              </motion.div>
            )}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Brain size={20} className="text-indigo-500 mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Texture Analysis</p>
              <p className="text-xs text-slate-500 mt-1">Detects unnatural skin smoothing and GAN noise.</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Eye size={20} className="text-indigo-500 mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Gaze Consistency</p>
              <p className="text-xs text-slate-500 mt-1">Checks for lighting and reflection mismatches.</p>
            </div>
          </div>
        </div>

        {/* Right: Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center"
              >
                <Scan size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Analysis results will appear here after the scan.</p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                {/* Status Header */}
                <div className={`p-6 flex items-center justify-between ${
                  result.face_analysis.status === 'No Issue' ? 'bg-emerald-500' : 
                  (result.face_analysis.status === 'Suspicious' ? 'bg-amber-500' : 'bg-red-500')
                } text-white`}>
                  <div className="flex items-center gap-3">
                    {result.face_analysis.status === 'No Issue' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80">Forensic Status</p>
                      <h3 className="text-xl font-black">{result.face_analysis.status}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Confidence</p>
                    <h3 className="text-2xl font-black">{result.face_analysis.confidence.toFixed(1)}%</h3>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Face Crop Preview */}
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Analyzed Facial Region</p>
                    <div className="relative aspect-square w-48 rounded-2xl overflow-hidden shadow-inner bg-slate-900 mx-auto">
                      <img src={`data:image/jpeg;base64,${result.face_analysis.face_img_base64}`} alt="Face" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Suspicious Regions */}
                  {result.face_analysis.key_regions?.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Suspicious Areas Detected</p>
                      <div className="flex flex-wrap gap-2">
                        {result.face_analysis.key_regions.map(r => (
                          <span key={r} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bullet Points */}
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Forensic Insights</p>
                    <ul className="space-y-4">
                      {result.face_analysis.explanation.map((e, i) => (
                        <li key={i} className="flex gap-4">
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            {i + 1}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{e}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-start gap-3">
                      <Info size={16} className="text-slate-400 shrink-0 mt-1" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        <strong>Technical Note:</strong> This analysis focuses exclusively on the facial bounding box. Global image artifacts are ignored in this mode to prioritize facial integrity validation.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default FaceAnalysis;
