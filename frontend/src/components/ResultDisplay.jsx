import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, ShieldCheck, AlertTriangle, ArrowLeft, Info,
  Brain, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const getColors = (theme) => ({
  textPrimary: theme === 'dark' ? '#F1F5F9' : '#0F172A',
  textSec:     theme === 'dark' ? '#94A3B8' : '#64748B',
  border:      theme === 'dark' ? '#1E293B' : '#E2E8F0',
  bg:          theme === 'dark' ? '#0B0F1A' : '#F8FAFC',
  card:        theme === 'dark' ? '#161E2E' : '#FFFFFF',
  accent:      theme === 'dark' ? '#6366F1' : '#4F46E5',
  accentBg:    theme === 'dark' ? '#1E1B4B' : '#F5F3FF',
  success:     theme === 'dark' ? '#10B981' : '#059669',
  successBg:   theme === 'dark' ? '#064E3B' : '#F0FDF4',
  warning:     theme === 'dark' ? '#F59E0B' : '#D97706',
  warningBg:   theme === 'dark' ? '#451A03' : '#FFFBEB',
  danger:      theme === 'dark' ? '#F43F5E' : '#E11D48',
  dangerBg:    theme === 'dark' ? '#4C0519' : '#FFF1F2',
});

// ── Reliability badge ─────────────────────────────────────────────────────────
const ReliabilityBadge = ({ reliability }) => {
  const map = {
    'High Confidence & Consistent': { icon: <ShieldCheck size={13}/>, color: '#059669', bg: '#F0FDF4', border: '#DCFCE7' },
    'Moderate Confidence':          { icon: <AlertCircle size={13}/>, color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' },
    'Low Confidence — Needs Review':{ icon: <AlertTriangle size={13}/>,color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
  };
  const s = map[reliability] || map['Moderate Confidence'];
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:6, color: s.color,
      fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px'
    }}>
      {s.icon} {reliability}
    </div>
  );
};

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, icon, children, noBorder, C }) => (
  <div style={{
    background: C.card, borderRadius:16,
    border: noBorder ? 'none' : `1px solid ${C.border}`,
    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
    overflow:'hidden', marginBottom:24
  }}>
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'16px 24px',
      borderBottom:`1px solid ${C.border}`, background: C.bg
    }}>
      <span style={{ color: C.accent }}>{icon}</span>
      <span style={{ fontSize:12, fontWeight:800, color: C.textPrimary, textTransform:'uppercase', letterSpacing:1.5 }}>{title}</span>
    </div>
    <div style={{ padding:'24px' }}>{children}</div>
  </div>
);

// ── Collapsible section ───────────────────────────────────────────────────────
const CollapsibleSection = ({ title, icon, children, C, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: C.card, borderRadius:16, border:`1px solid ${C.border}`,
      boxShadow:'0 4px 20px -5px rgba(0,0,0,0.05)', overflow:'hidden', marginBottom:24
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 24px', background: C.bg, border:'none', cursor:'pointer',
          borderBottom: open ? `1px solid ${C.border}` : 'none'
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color: C.accent }}>{icon}</span>
          <span style={{ fontSize:12, fontWeight:800, color: C.textPrimary, textTransform:'uppercase', letterSpacing:1.5 }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: C.textSec }}/> : <ChevronDown size={16} style={{ color: C.textSec }}/>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:.25 }}
            style={{ overflow:'hidden' }}
          >
            <div style={{ padding:'24px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── PDF Generator ─────────────────────────────────────────────────────────────
const generatePDF = (resultData) => {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W     = 210;
  const margin= 18;
  const col   = W - margin * 2;
  let   y     = 0;

  // helpers
  const rule = (yy) => { doc.setDrawColor(229,231,235); doc.line(margin, yy, W - margin, yy); };
  const label = (txt, yy) => {
    doc.setFontSize(8); doc.setTextColor(107,114,128); doc.setFont(undefined,'bold');
    doc.text(txt.toUpperCase(), margin, yy);
  };
  const value = (txt, yy, color) => {
    if (color) doc.setTextColor(...color); else doc.setTextColor(17,24,39);
    doc.setFontSize(11); doc.setFont(undefined,'normal');
    doc.text(txt, margin, yy + 5);
    doc.setTextColor(17,24,39);
  };

  // ── Header ──
  doc.setFillColor(79,70,229);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(15); doc.setFont(undefined,'bold');
  doc.text('AI-Based Image Authenticity Analysis Report', margin, 12);
  doc.setFontSize(8); doc.setFont(undefined,'normal');
  doc.text('CIFAKE — Explainable AI Detection System', margin, 20);
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - margin, 20, { align:'right' });
  y = 36;

  // ── Section 1: Image Info ──
  label('Image Information', y); y += 6;
  rule(y); y += 5;
  doc.setFontSize(10); doc.setTextColor(17,24,39);
  doc.text(`Filename: ${resultData.filename}`, margin, y); y += 6;
  doc.text(`Analyzed: ${resultData.analyzedAt ? new Date(resultData.analyzedAt).toLocaleString() : 'N/A'}`, margin, y); y += 10;

  // ── Section 2: Use Case ──
  label('Analysis Context', y); y += 6;
  rule(y); y += 5;
  doc.setFontSize(10); doc.setTextColor(79,70,229);
  doc.text(resultData.use_case_label || 'General Analysis', margin, y); y += 6;
  if (resultData.context_note) {
    doc.setTextColor(107,114,128); doc.setFontSize(9);
    const ctxLines = doc.splitTextToSize(resultData.context_note, col);
    doc.text(ctxLines, margin, y); y += ctxLines.length * 5 + 5;
  }

  // ── Section 3: Prediction ──
  const isFake = resultData.prediction === 'FAKE';
  const predColor = isFake ? [239,68,68] : [16,185,129];
  label('Prediction Result', y); y += 6;
  rule(y); y += 5;
  doc.setFontSize(18); doc.setFont(undefined,'bold');
  doc.setTextColor(...predColor);
  doc.text(resultData.prediction, margin, y); y += 8;

  doc.setFontSize(10); doc.setFont(undefined,'normal');
  doc.setTextColor(17,24,39);
  doc.text(`Confidence Score: ${resultData.confidence?.toFixed(1)}%`, margin, y); y += 6;
  doc.text(`Risk Level: ${resultData.risk_level || 'N/A'}`, margin, y); y += 5;

  // Reliability badge row
  label('Reliability', y); y += 6;
  doc.setFontSize(10); doc.setTextColor(17,24,39);
  doc.text(resultData.reliability || 'N/A', margin, y); y += 10;

  // ── Section 4: Images ──
  if (resultData.originalImage) {
    try {
      label('Uploaded Image', y); y += 6;
      rule(y); y += 4;
      doc.addImage(resultData.originalImage, 'JPEG', margin, y, 70, 45);
    } catch(_) {}
    if (resultData.gradcamBase64) {
      try {
        label('Grad-CAM Visualization', y + 2);
        doc.addImage(resultData.gradcamBase64, 'PNG', margin + 80, y, 100, 48);
      } catch(_) {}
    }
    y += 54;
  }

  // ── Section 6: Explainability ──
  label('Explainability Insights', y); y += 6;
  rule(y); y += 5;
  (resultData.explanation_points || []).forEach((pt, i) => {
    // Check for page overflow
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(9); doc.setTextColor(17,24,39);
    const lines = doc.splitTextToSize(`${i+1}. ${pt}`, col);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  });
  y += 4;

  // ── Section 7: Limitations ──
  label('Model Limitations', y); y += 6;
  rule(y); y += 5;
  const limits = [
    'Model trained on low-resolution images (32×32) — may miss subtle high-quality edits.',
    'Grad-CAM highlights are approximations, not pixel-level explanations.',
    'Results should be used as decision-support, not as definitive proof.'
  ];
  limits.forEach((lim, i) => {
    doc.setFontSize(9); doc.setTextColor(107,114,128);
    const lines = doc.splitTextToSize(`• ${lim}`, col);
    doc.text(lines, margin, y); y += lines.length * 5 + 2;
  });
  y += 6;

  // ── Footer ──
  rule(y); y += 5;
  doc.setFontSize(8); doc.setTextColor(107,114,128);
  doc.text('CIFAKE — AI Image Authenticity Detection System', margin, y);
  doc.text('This report is generated by an AI model and should not be used as sole evidence.', W - margin, y, { align:'right' });

  doc.save(`CIFAKE-Report-${resultData.filename || 'analysis'}.pdf`);
};

// ── Main Component ────────────────────────────────────────────────────────────
const ResultDisplay = ({ resultData }) => {
  const { theme } = useTheme();
  const C = getColors(theme);
  const [sliderPos, setSliderPos] = useState(50);
  const [showFaceGrad, setShowFaceGrad] = useState(false);
  const navigate = useNavigate();

  const isFake      = resultData.prediction === 'FAKE';
  const riskLevel   = resultData.risk_level   || (isFake ? 'High Risk'   : 'Low Risk');
  const reliability = resultData.reliability  || (isFake ? 'Moderate Confidence' : 'High Confidence & Consistent');
  const points      = resultData.explanation_points || [];
  const contextNote = resultData.context_note  || '';
  const useCaseLabel= resultData.use_case_label|| 'General Analysis';

  const predColor = isFake ? C.danger : C.success;
  const predBg    = isFake ? C.dangerBg : C.successBg;
  const predBorder= isFake ? '#FECACA' : '#A7F3D0';

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 16px', background: C.bg, minHeight:'100vh' }}>

      {/* Back link */}
      <button
        onClick={() => navigate('/upload')}
        style={{
          display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
          color: C.accent, fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:24
        }}
      >
        <ArrowLeft size={16}/> Analyze Another Image
      </button>

      {/* ── 1. Verdict Card ──────────────────────────────── */}
      <div style={{
        borderRadius:24, background: C.card, border:`1px solid ${C.border}`,
        boxShadow:'0 10px 40px -10px rgba(0,0,0,0.08)', overflow:'hidden', marginBottom:28
      }}>
        {/* Top accent bar */}
        <div style={{ height:6, background: isFake ? `linear-gradient(90deg, ${C.danger}, #FB7185)` : `linear-gradient(90deg, ${C.success}, #34D399)` }} />
        
        <div style={{ padding:'32px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:24 }}>
            <div style={{ flex:1, minWidth:300 }}>
              {/* Category indicator */}
              <div style={{
                display:'inline-flex', alignItems:'center', gap:8,
                color: C.accent, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:1.5, marginBottom:16
              }}>
                <Brain size={12}/> {useCaseLabel}
              </div>
              
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:36, fontWeight:950, color: C.textPrimary, lineHeight:1, letterSpacing:'-1.5px', display:'flex', alignItems:'center', gap:12 }}>
                    {isFake ? <AlertTriangle size={24} style={{ color: C.danger }}/> : <ShieldCheck size={24} style={{ color: C.success }}/>}
                    IMAGE IS <span style={{ color: predColor }}>{resultData.prediction}</span>
                  </h2>
                  <p style={{ margin:'4px 0 0', fontSize:14, color: C.textSec, fontWeight:500 }}>
                    File: <span style={{ color: C.textPrimary, fontWeight:600 }}>{resultData.filename}</span>
                  </p>
                </div>
              </div>

              {contextNote && (
                <div style={{ 
                  marginTop:20, padding:'12px 16px', borderRadius:12, 
                  background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  borderLeft:`4px solid ${C.accent}`, color: C.textSec, fontSize:14, fontStyle:'italic', lineHeight:1.5
                }}>
                  "{contextNote}"
                </div>
              )}
            </div>

            <div style={{ 
              textAlign:'right', minWidth:180
            }}>
              <p style={{ margin:'0 0 4px', fontSize:10, fontWeight:800, color: C.textSec, textTransform:'uppercase', letterSpacing:1.5 }}>Forensic Confidence</p>
              <p style={{ margin:'0 0 16px', fontSize:48, fontWeight:950, color: C.textPrimary, lineHeight:1 }}>
                {resultData.confidence?.toFixed(1)}<span style={{ fontSize:22, color: C.textSec, fontWeight:700 }}>%</span>
              </p>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                <span style={{
                  fontSize:11, fontWeight:900, color: isFake ? C.danger : C.success, textTransform:'uppercase', letterSpacing:1
                }}>{riskLevel.toUpperCase()}</span>
                <ReliabilityBadge reliability={reliability} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Visual Analysis ───────────────────────────── */}
      <Section title="Visual Analysis — Grad-CAM" icon={<Eye size={16}/>} C={C}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Slider viewer */}
          <div>
            <p style={{ fontSize:12, color: C.textSec, marginBottom:8 }}>Slide to compare Original ↔ Grad-CAM</p>
            <div
              style={{ position:'relative', width:'100%', paddingBottom:'66%', background:'#111', borderRadius:12, overflow:'hidden', cursor:'crosshair' }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setSliderPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
              }}
            >
              <img src={resultData.originalImage} alt="Original"
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain' }}/>
              <div style={{ position:'absolute', inset:'0', right:`${100 - sliderPos}%`, overflow:'hidden' }}>
                <img src={resultData.gradcamBase64} alt="Grad-CAM"
                  style={{ position:'absolute', top:0, left:0, width:`${10000/sliderPos}%`, height:'100%', objectFit:'contain', opacity:.85, mixBlendMode:'multiply' }}/>
              </div>
              <div style={{ position:'absolute', top:0, bottom:0, width:2, background:'#fff', left:`${sliderPos}%`, boxShadow:'0 0 6px rgba(0,0,0,.5)' }}>
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:28, height:28, background:'#fff', borderRadius:'50%', boxShadow:'0 2px 8px rgba(0,0,0,.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ display:'flex', gap:3 }}>
                    <div style={{ width:2, height:10, background:'#9CA3AF', borderRadius:2 }}/>
                    <div style={{ width:2, height:10, background:'#9CA3AF', borderRadius:2 }}/>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Grad-CAM */}
          <div>
            <p style={{ fontSize:12, color: C.textSec, marginBottom:8 }}>Full Grad-CAM Visualization</p>
            <div style={{ borderRadius:12, overflow:'hidden', background:'#111' }}>
              <img src={resultData.gradcamBase64} alt="Grad-CAM full"
                style={{ width:'100%', objectFit:'contain', display:'block' }}/>
            </div>
            <p style={{ fontSize:11, color: C.textSec, marginTop:6 }}>
              Red/hot areas indicate regions the model focused on most during prediction.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 3. Explainability Panel ──────────────────────── */}
      <CollapsibleSection title="Why This Decision Was Made" icon={<Brain size={16}/>} C={C}>
        <p style={{ fontSize:13, color: C.textSec, marginBottom:16 }}>
          The following factors contributed to the model's decision:
        </p>
        <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:10 }}>
          {points.map((pt, i) => (
            <motion.li key={i}
              initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*.06 }}
              style={{ display:'flex', alignItems:'flex-start', gap:12 }}
            >
              <span style={{
                flexShrink:0, width:22, height:22, borderRadius:'50%',
                background: C.accentBg, border:`1px solid #C7D2FE`,
                color: C.accent, fontSize:11, fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>{i+1}</span>
              <span style={{ fontSize:14, color: C.textPrimary, lineHeight:1.6 }}>{pt}</span>
            </motion.li>
          ))}
          <li style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <span style={{
              flexShrink:0, width:22, height:22, borderRadius:'50%',
              background: C.accentBg, border:`1px solid #C7D2FE`,
              color: C.accent, fontSize:11, fontWeight:800,
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>{points.length + 1}</span>
            <span style={{ fontSize:14, color: C.textPrimary, lineHeight:1.6 }}>
              Grad-CAM heatmap shows spatial regions activating the final convolution layer — red/hot areas indicate highest model attention.
            </span>
          </li>
        </ul>
      </CollapsibleSection>

      {/* ── 4. How It Works ─────────────────────────────── */}
      <CollapsibleSection title="How This Works" icon={<Info size={16}/>} C={C} defaultOpen={false}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          {[
            { title:'CNN Model',   body:'A Convolutional Neural Network analyzes pixel patterns and feature maps to detect manipulation artifacts invisible to the human eye.' },
            { title:'Grad-CAM',    body:'Gradient-weighted Class Activation Mapping highlights the image regions that most influenced the model\'s final decision.' },
            { title:'Risk Logic',  body:'Risk level is derived from model confidence and anomaly intensity — High Risk means the model is highly certain the image is AI-generated.' },
          ].map(({ title, body }) => (
            <div key={title} style={{
              background:'#FAFAFA', borderRadius:12, border:`1px solid ${C.border}`, padding:16
            }}>
              <p style={{ margin:'0 0 6px', fontSize:12, fontWeight:700, color: C.accent, textTransform:'uppercase', letterSpacing:.5 }}>{title}</p>
              <p style={{ margin:0, fontSize:13, color: C.textPrimary, lineHeight:1.6 }}>{body}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── 5. Model Limitations ────────────────────────── */}
      <CollapsibleSection title="Model Limitations" icon={<AlertCircle size={16}/>} C={C} defaultOpen={false}>
        <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
          {[
            'Model trained on low-resolution images (32×32) — may miss subtle or high-quality AI edits.',
            'Grad-CAM highlights are approximations, not exact pixel-level explanations.',
            'Results represent probabilistic estimates and should not be used as sole evidence.',
          ].map((lim, i) => (
            <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color: C.textPrimary }}>
              <AlertTriangle size={14} style={{ color: C.warning, flexShrink:0, marginTop:3 }}/>
              {lim}
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* ── 6. Disclaimer ───────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px',
        borderRadius:12, background: C.warningBg, border:`1px solid #FDE68A`,
        fontSize:13, color:'#92400E', marginBottom:28
      }}>
        <AlertTriangle size={16} style={{ color: C.warning, flexShrink:0, marginTop:2 }}/>
        <span>
          <strong style={{ color:'#78350F' }}>Disclaimer: </strong>
          This analysis is generated by an AI model and may not be fully accurate.
          Results should be used as decision-support, not as definitive evidence of image manipulation.
        </span>
      </div>

      {/* ── Actions ─────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
        <button
          onClick={() => navigate('/upload')}
          style={{
            display:'flex', alignItems:'center', gap:8, padding:'12px 24px',
            borderRadius:12, border:`1px solid ${C.border}`, background: C.card,
            color: C.textPrimary, fontSize:14, fontWeight:600, cursor:'pointer'
          }}
        >
          <ArrowLeft size={16}/> Analyze Another
        </button>
        <button
          onClick={() => generatePDF(resultData)}
          style={{
            display:'flex', alignItems:'center', gap:8, padding:'12px 28px',
            borderRadius:12, border:'none', background: C.accent,
            color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(79,70,229,0.35)'
          }}
        >
          <Download size={16}/> Download PDF Report
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;
