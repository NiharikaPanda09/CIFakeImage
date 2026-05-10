import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, AlertCircle, Loader2, ChevronDown, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const USE_CASES = [
  { value: 'general',      label: 'General Analysis',          desc: 'Standard AI image authenticity check' },
  { value: 'social_media', label: 'Social Media Image Check',  desc: 'Detect misleading content before sharing' },
  { value: 'news',         label: 'News Verification',         desc: 'Verify journalistic image authenticity' },
  { value: 'research',     label: 'Research Validation',       desc: 'Validate scientific image integrity' },
];

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [useCase, setUseCase]       = useState('general');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const selectedCase = USE_CASES.find(u => u.value === useCase);

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
    if (!f.type.match('image.*')) { setError('Please upload an image file (JPEG, PNG, etc).'); return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const generateThumbnail = (dataUrl) => new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 150;
      canvas.width  = MAX_WIDTH;
      canvas.height = img.height * (MAX_WIDTH / img.width);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('use_case', useCase);

    try {
      const response = await axios.post('http://localhost:5000/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      const resultData = {
        filename:        file.name,
        prediction:      response.data.prediction,
        confidence:      response.data.confidence,
        risk_level:      response.data.risk_level,
        reliability:     response.data.reliability,
        explanation_points: response.data.explanation_points,
        context_note:    response.data.context_note,
        use_case:        response.data.use_case,
        use_case_label:  response.data.use_case_label,
        gradcamBase64:   `data:image/png;base64,${response.data.gradcam_base64}`,
        originalImage:   preview,
        analyzedAt:      new Date().toISOString(),
      };

      // Save to history (non-blocking)
      generateThumbnail(preview).then(thumbnail => {
        axios.post('http://localhost:5000/api/save-result', {
          filename: file.name,
          prediction: resultData.prediction,
          confidence: resultData.confidence,
          thumbnail_base64: thumbnail
        }, { withCredentials: true }).catch(() => {});
      });

      navigate('/results', { state: { resultData } });
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Ensure the backend server is running.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-12"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Analyze an Image</h2>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
          Upload an image and select a use case to receive context-aware authenticity insights.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">

        {/* ── Use Case Selector ── */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-slate-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Analysis Context
          </label>
          <div className="relative">
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              {USE_CASES.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {selectedCase && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Info size={12} /> {selectedCase.desc}
            </p>
          )}
        </div>

        {/* ── Upload Zone ── */}
        <div className="p-8">
          <div
            className={`relative border-2 border-dashed rounded-xl transition-all duration-200
              ${dragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 hover:border-gray-300 dark:hover:border-slate-500'
              }
              ${!preview ? 'p-12' : 'p-6'}
              flex flex-col items-center justify-center`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!preview ? (
              <>
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <UploadIcon size={26} className="text-indigo-500" />
                </div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Drag and drop your image here
                </p>
                <p className="text-sm text-gray-400 mb-6">or</p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-5 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                >
                  Browse Files
                </button>
                <p className="mt-4 text-xs text-gray-400">JPEG, PNG, WEBP supported</p>
                <input ref={inputRef} type="file" className="hidden" accept="image/*"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
              </>
            ) : (
              <div className="w-full flex flex-col items-center gap-5">
                <div className="relative w-full max-w-sm aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-inner flex justify-center">
                  <img src={preview} alt="Preview" className="object-contain h-full w-full" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                  >
                    {loading
                      ? <><Loader2 className="animate-spin" size={16} /> Analyzing...</>
                      : 'Analyze Image'
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              {error}
            </motion.div>
          )}
        </div>
      </div>

      {/* How It Works — compact teaser */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { title: 'CNN Model', body: 'Analyzes pixel patterns to detect manipulation at the feature level.' },
          { title: 'Grad-CAM',  body: 'Highlights image regions that most influenced the model decision.' },
          { title: 'Risk Logic', body: 'Risk level derived from confidence score and anomaly intensity.' },
        ].map(({ title, body }) => (
          <div key={title} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Upload;
