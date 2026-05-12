import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, Zap, AlertTriangle, Brain,
  Info, ChevronDown, ChevronUp, Scale, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ── Color tokens ─────────────────────────────────────────────────────────────
const getColors = (theme) => ({
  bg:         theme === 'dark' ? '#0B0F1A' : '#F8FAFC',
  card:       theme === 'dark' ? '#161E2E' : '#FFFFFF',
  border:     theme === 'dark' ? '#1E293B' : '#E2E8F0',
  textPrimary:theme === 'dark' ? '#F1F5F9' : '#0F172A',
  textSec:    theme === 'dark' ? '#94A3B8' : '#64748B',
  accent:     theme === 'dark' ? '#6366F1' : '#4F46E5',
  accentBg:   theme === 'dark' ? '#1E1B4B' : '#F5F3FF',
  success:    theme === 'dark' ? '#10B981' : '#059669',
  successBg:  theme === 'dark' ? '#064E3B' : '#F0FDF4',
  warning:    theme === 'dark' ? '#F59E0B' : '#D97706',
  warningBg:  theme === 'dark' ? '#451A03' : '#FFFBEB',
  danger:     theme === 'dark' ? '#F43F5E' : '#E11D48',
  dangerBg:   theme === 'dark' ? '#4C0519' : '#FFF1F2',
});

// ── Risk helpers ──────────────────────────────────────────────────────────────
const riskStyle = (risk, C) => {
  if (risk === 'High')   return { color: C.danger,  bg: C.dangerBg,  border: C.theme === 'dark' ? '#881337' : '#FECDD3' };
  if (risk === 'Medium') return { color: C.warning, bg: C.warningBg, border: C.theme === 'dark' ? '#78350F' : '#FEF3C7' };
  return                        { color: C.success, bg: C.successBg, border: C.theme === 'dark' ? '#064E3B' : '#DCFCE7' };
};

const barColor = (isSusp, C) => isSusp 
  ? `linear-gradient(90deg, ${C.danger}, #FB7185)` 
  : `linear-gradient(90deg, ${C.success}, #34D399)`;

// ── Confidence Bar ────────────────────────────────────────────────────────────
const ConfidenceBar = ({ label, confidence, fakeConf, riskLevel, isSuspicious }) => {
  const { theme } = useTheme();
  const C = { ...getColors(theme), theme };
  const s = riskStyle(riskLevel, C);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, padding:12, borderRadius:12, background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:800, color: C.textPrimary, fontSize:13, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
          <span style={{
            fontSize:10, fontWeight:800, padding:'2px 10px', borderRadius:99,
            background: isSuspicious ? C.dangerBg : C.successBg,
            color: isSuspicious ? C.danger : C.success,
            textTransform:'uppercase', letterSpacing:'0.5px',
            border:`1px solid ${isSuspicious ? (theme === 'dark' ? '#881337' : '#FECDD3') : (theme === 'dark' ? '#064E3B' : '#DCFCE7')}`
          }}>
            {isSuspicious ? 'High Risk Artifacts' : 'Clean Signature'}
          </span>
        </div>
        <div style={{ textAlign:'right' }}>
          <span style={{ fontSize:14, fontWeight:900, color: s.color }}>{fakeConf.toFixed(1)}%</span>
          <span style={{ fontSize:10, fontWeight:700, color: C.textSec, marginLeft:4, textTransform:'uppercase' }}>Fake Prob.</span>
        </div>
      </div>
      <div style={{ height:12, background: theme === 'dark' ? '#1E293B' : '#E2E8F0', borderRadius:99, overflow:'hidden', position:'relative' }}>
        <motion.div
          style={{ height:'100%', borderRadius:99, background: barColor(isSuspicious, C) }}
          initial={{ width:0 }}
          animate={{ width:`${Math.min(fakeConf,100)}%` }}
          transition={{ duration:1.2, ease:[0.22, 1, 0.36, 1], delay:0.2 }}
        />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <p style={{ fontSize:11, color: C.textSec, margin:0, fontWeight:600 }}>
          Inference: <span style={{ color: C.textPrimary }}>{confidence.toFixed(1)}%</span>
        </p>
        <p style={{ fontSize:11, color: C.textSec, margin:0, fontWeight:600 }}>
          Status: <span style={{ color: s.color, fontWeight:800 }}>{riskLevel.toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
};

// ── Upload Zone ───────────────────────────────────────────────────────────────
const UploadZone = ({ label, preview, onFile, onClear, accentColor }) => {
  const { theme } = useTheme();
  const C = getColors(theme);
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{
          width:28, height:28, borderRadius:'50%', background: accentColor,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontSize:13, fontWeight:900
        }}>{label}</span>
        <span style={{ fontWeight:600, color: C.textPrimary, fontSize:15 }}>Image {label}</span>
      </div>
      <div
        onClick={() => !preview && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          position:'relative', width:'100%', paddingBottom:'56.25%',
          borderRadius:16, overflow:'hidden', cursor: preview ? 'default' : 'pointer',
          border: `2px dashed ${drag ? C.accent : C.border}`,
          background: drag ? C.accentBg : (theme === 'dark' ? '#1E293B' : '#F9FAFB'),
          transition:'all .2s'
        }}
      >
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {preview ? (
            <>
              <img src={preview} alt={`Image ${label}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                style={{
                  position:'absolute', top:10, right:10, width:28, height:28, borderRadius:'50%',
                  background: C.danger, color:'#fff', border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}
              ><X size={14}/></button>
              <span style={{
                position:'absolute', bottom:10, left:10, fontSize:11, fontWeight:700,
                background: accentColor, color:'#fff', padding:'2px 10px', borderRadius:99
              }}>Image {label}</span>
            </>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <div style={{
                width:52, height:52, borderRadius:14, background: C.accentBg,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <Upload style={{ color: C.accent }} size={22}/>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:13, fontWeight:600, color: C.textPrimary, margin:0 }}>
                  Drop image or <span style={{ color: C.accent, textDecoration:'underline' }}>browse</span>
                </p>
                <p style={{ fontSize:11, color: C.textSec, margin:'2px 0 0' }}>JPG, PNG, WEBP</p>
              </div>
              <input ref={inputRef} type="file" style={{ display:'none' }} accept="image/*"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) onFile(f);
                  e.target.value = '';
                }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Image Panel ───────────────────────────────────────────────────────────────
const ImagePanel = ({ label, preview, result, isSuspicious }) => {
  const { theme } = useTheme();
  const C = getColors(theme);
  const [showGrad, setShowGrad] = useState(false);
  const s = riskStyle(result.risk_level, C);

  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.45 }}
      style={{
        borderRadius:16, overflow:'hidden', border:`1.5px solid ${s.border}`,
        background: C.card, boxShadow:'0 2px 12px rgba(0,0,0,0.07)'
      }}
    >
      <div style={{ position:'relative', width:'100%', paddingBottom:'66%', background:'#111' }}>
        <img src={preview} alt={`Image ${label}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }} />
        <AnimatePresence>
          {showGrad && (
            <motion.img
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              src={result.gradcam_base64}
              style={{
                position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'contain', mixBlendMode:'multiply', opacity:.85
              }}
            />
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowGrad(!showGrad)}
          style={{
            position:'absolute', bottom:10, right:10, padding:'6px 12px',
            borderRadius:8, background: showGrad ? C.accent : 'rgba(0,0,0,0.6)',
            color:'#fff', border:'none', cursor:'pointer', fontSize:11,
            display:'flex', alignItems:'center', gap:6, backdropFilter:'blur(4px)'
          }}
        >
          {showGrad ? <><EyeOff size={14}/> Hide Grad-CAM</> : <><Eye size={14}/> Show Grad-CAM</>}
        </button>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color: C.textPrimary }}>Image {label}</span>
          <span style={{
            fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99,
            background: s.bg, color: s.color, border:`1px solid ${s.border}`
          }}>{result.prediction}</span>
        </div>
        <div style={{ height:6, background: theme === 'dark' ? '#334155' : '#F3F4F6', borderRadius:99, overflow:'hidden', marginBottom:8 }}>
          <div style={{ height:'100%', width:`${result.confidence}%`, background: s.color }} />
        </div>
        <p style={{ fontSize:11, color: C.textSec, margin:0 }}>
          Model Confidence: <strong style={{ color: C.textPrimary }}>{result.confidence.toFixed(1)}%</strong>
        </p>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Compare = () => {
  const { theme } = useTheme();
  const C = getColors(theme);
  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);
  const [previewA, setPreviewA] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insightsOpen, setInsightsOpen] = useState(true);

  const handleFile = (file, setter, previewSetter) => {
    setter(file);
    previewSetter(URL.createObjectURL(file));
    setResult(null);
  };

  const handleCompare = async () => {
    if (!imageA || !imageB) { setError('Please upload both images.'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const form = new FormData();
      form.append('imageA', imageA);
      form.append('imageB', imageB);
      const res = await axios.post('http://localhost:5000/api/compare', form, { withCredentials:true });
      setResult(res.data);
      setTimeout(() => document.getElementById('cmp-results')?.scrollIntoView({ behavior:'smooth' }), 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const susp = result?.comparison?.more_suspicious;
  const fakeConfA = result?.comparison?.fake_conf_A ?? 0;
  const fakeConfB = result?.comparison?.fake_conf_B ?? 0;

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 16px', background: C.bg, minHeight:'100vh' }}>
      
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:48 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px',
          borderRadius:99, background: C.accentBg, border:`1px solid #C7D2FE`,
          color: C.accent, fontSize:12, fontWeight:700, marginBottom:16
        }}>
          <Scale size={14}/> AI Forensics Comparison
        </div>
        <h1 style={{ margin:0, fontSize:42, fontWeight:900, color: C.textPrimary, letterSpacing:'-1px' }}>
          Compare Images
        </h1>
        <p style={{ marginTop:12, fontSize:16, color: C.textSec, maxWidth:520, marginInline:'auto', lineHeight:1.6 }}>
          Upload two images to discover <strong style={{ color: C.accent }}>which is more likely fake</strong> and
          understand exactly why.
        </p>
      </div>

      {/* Upload Zones */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:32 }}>
        <UploadZone label="A" preview={previewA} onFile={(f) => handleFile(f, setImageA, setPreviewA)} onClear={() => { setImageA(null); setPreviewA(null); }} accentColor="#4F46E5" />
        <UploadZone label="B" preview={previewB} onFile={(f) => handleFile(f, setImageB, setPreviewB)} onClear={() => { setImageB(null); setPreviewB(null); }} accentColor="#818CF8" />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{
              display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
              borderRadius:10, background: C.dangerBg, border:`1px solid ${C.danger}`,
              color: C.danger, fontSize:14, marginBottom:20
            }}>
            <AlertTriangle size={16}/> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'flex', justifyContent:'center', marginBottom:48 }}>
        <button
          onClick={handleCompare}
          disabled={!imageA || !imageB || loading}
          style={{
            display:'flex', alignItems:'center', gap:10, padding:'14px 36px',
            borderRadius:14, border:'none', cursor: (!imageA||!imageB||loading)?'not-allowed':'pointer',
            background: (!imageA||!imageB||loading) ? (theme === 'dark' ? '#312E81' : '#C7D2FE') : C.accent,
            color:'#fff', fontSize:15, fontWeight:700,
            transition:'all .2s'
          }}
        >
          {loading ? 'Analyzing...' : <><Zap size={18}/> Run Comparison Analysis</>}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div id="cmp-results" initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}
            style={{ display:'flex', flexDirection:'column', gap:24 }}>
            
            {/* 1. Hero Summary Card */}
            <div style={{
              borderRadius:24, border:`1px solid ${C.border}`,
              background: C.card, boxShadow:'0 10px 30px -10px rgba(0,0,0,0.1)', overflow:'hidden'
            }}>
              <div style={{
                background: susp==='A'
                  ? (theme === 'dark' ? 'linear-gradient(135deg, rgba(225,29,72,0.1), transparent)' : 'linear-gradient(135deg, rgba(225,29,72,0.05), transparent)')
                  : (theme === 'dark' ? 'linear-gradient(135deg, rgba(5,150,105,0.1), transparent)' : 'linear-gradient(135deg, rgba(5,150,105,0.05), transparent)'),
                padding:'32px'
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10, background: C.accentBg,
                        display:'flex', alignItems:'center', justifyContent:'center'
                      }}>
                        <ShieldCheck size={18} style={{ color: C.accent }}/>
                      </div>
                      <span style={{ fontSize:12, fontWeight:800, color: C.accent, letterSpacing:1.5, textTransform:'uppercase' }}>
                        Forensic Disparity Report
                      </span>
                    </div>
                    <h2 style={{ margin:'0 0 12px', fontSize:32, fontWeight:900, color: C.textPrimary, lineHeight:1.1, letterSpacing:'-1px' }}>
                      Image <span style={{ color: C.accent }}>{susp}</span> shows higher <span style={{ color: C.danger }}>synthetic probability</span>
                    </h2>
                    <p style={{ margin:0, color: C.textSec, fontSize:15, lineHeight:1.6, fontWeight:500 }}>
                      Comparison shows Image {susp} is {result.comparison.confidence_diff.toFixed(1)}% more likely to be AI-generated than Image {susp==='A'?'B':'A'}.
                    </p>
                  </div>
                  <div style={{ 
                    padding:20, borderRadius:20, background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    textAlign:'center', border:`1px solid ${C.border}`, minWidth:140
                  }}>
                    <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:800, color: C.textSec, letterSpacing:1.5, textTransform:'uppercase' }}>
                      Delta Confidence
                    </p>
                    <p style={{ margin:0, fontSize:42, fontWeight:950, color: C.textPrimary, lineHeight:1 }}>
                      {result.comparison.confidence_diff.toFixed(1)}
                      <span style={{ fontSize:20, color: C.textSec, fontWeight:700 }}>%</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Confidence Bars */}
            <div style={{
              borderRadius:16, background: C.card, border:`1px solid ${C.border}`,
              boxShadow:'0 2px 10px rgba(0,0,0,0.05)', padding:24
            }}>
              <h3 style={{ margin:'0 0 18px', fontSize:15, fontWeight:700, color: C.textPrimary, display:'flex', alignItems:'center', gap:8 }}>
                <Zap size={16} style={{ color: C.accent }}/> Fake Probability Comparison
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <ConfidenceBar label="Image A" confidence={result.imageA.confidence} fakeConf={fakeConfA}
                  riskLevel={result.imageA.risk_level} isSuspicious={susp==='A'}/>
                <ConfidenceBar label="Image B" confidence={result.imageB.confidence} fakeConf={fakeConfB}
                  riskLevel={result.imageB.risk_level} isSuspicious={susp==='B'}/>
              </div>
            </div>

            {/* 3. Side-by-Side Images */}
            <div>
              <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:700, color: C.textPrimary, display:'flex', alignItems:'center', gap:8 }}>
                <Eye size={16} style={{ color: C.accent }}/> Visual Analysis — Grad-CAM Overlay
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
                <ImagePanel label="A" preview={previewA} result={result.imageA} isSuspicious={susp==='A'}/>
                <ImagePanel label="B" preview={previewB} result={result.imageB} isSuspicious={susp==='B'}/>
              </div>
            </div>

            {/* 4. Insights */}
            <div style={{
              borderRadius:16, background: C.card, border:`1px solid #C7D2FE`,
              boxShadow:'0 2px 10px rgba(0,0,0,0.05)', overflow:'hidden'
            }}>
              <button
                onClick={() => setInsightsOpen(v => !v)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'16px 22px', background:'none', border:'none', cursor:'pointer'
                }}
              >
                <span style={{ fontSize:15, fontWeight:700, color: C.textPrimary, display:'flex', alignItems:'center', gap:8 }}>
                  <Brain size={16} style={{ color: C.accent }}/> Why this comparison? — Model Insights
                </span>
                {insightsOpen ? <ChevronUp size={16} style={{ color: C.textSec }}/> : <ChevronDown size={16} style={{ color: C.textSec }}/>}
              </button>
              <AnimatePresence initial={false}>
                {insightsOpen && (
                  <motion.div
                    initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                    exit={{ height:0, opacity:0 }} transition={{ duration:.3 }}
                    style={{ overflow:'hidden' }}
                  >
                    <ul style={{ padding:'0 22px 20px', margin:0, listStyle:'none', display:'flex', flexDirection:'column', gap:12 }}>
                      {result.comparison.insights.map((insight, i) => (
                        <motion.li key={i}
                          initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*.07 }}
                          style={{ display:'flex', alignItems:'flex-start', gap:12, fontSize:14, color: C.textPrimary }}
                        >
                          <span style={{
                            flexShrink:0, width:22, height:22, borderRadius:'50%',
                            background: C.accentBg, border:`1px solid #C7D2FE`,
                            color: C.accent, fontSize:11, fontWeight:800,
                            display:'flex', alignItems:'center', justifyContent:'center'
                          }}>{i+1}</span>
                          {insight}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Similarity Note */}
            {result.similarity_note && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
                style={{
                  display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px',
                  borderRadius:12, background: C.card, border:`1px solid ${C.border}`,
                  fontSize:14, color: C.textPrimary
                }}>
                <Info size={16} style={{ color: C.textSec, flexShrink:0, marginTop:2 }}/>
                <div>
                  <strong>Image Similarity: </strong>
                  <span style={{ color: C.textSec }}>{result.similarity_note}</span>
                  {result.similarity_score != null && (
                    <span style={{ color: C.textSec, fontSize:12, marginLeft:6 }}>
                      (score: {(result.similarity_score*100).toFixed(0)}%)
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* 6. Disclaimer */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.4 }}
              style={{
                display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px',
                borderRadius:12, background: C.warningBg, border:`1px solid #FDE68A`,
                fontSize:14, color:'#92400E'
              }}>
              <AlertTriangle size={16} style={{ color: C.warning, flexShrink:0, marginTop:2 }}/>
              <span>
                <strong style={{ color:'#78350F' }}>Disclaimer: </strong>
                This comparison is based on model predictions and may not be fully accurate.
                Results should be used as a reference, not as definitive evidence of image manipulation.
              </span>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Compare;
