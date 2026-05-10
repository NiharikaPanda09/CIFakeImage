import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { ShieldCheck, ScanFace, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444']; // Blue for Real, Red for Fake

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/analytics', { withCredentials: true });
        setData(response.data);
      } catch (err) {
        const msg = err.response?.status === 401
          ? 'You must be logged in to view analytics.'
          : err.response?.data?.error || 'Failed to fetch analytics data.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-center">
        <p className="font-bold text-lg mb-1">Unable to load analytics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="text-center mt-20 p-8 max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
        <p className="text-gray-600 dark:text-gray-400">Analyze some images to populate your dashboard.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">Total Analyzed</h3>
          <p className="text-3xl font-bold mt-2">{data.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">Real Images</h3>
          <p className="text-3xl font-bold mt-2">{data.distribution.find(d => d.name === 'Real')?.value || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase font-semibold">Fake Images</h3>
          <p className="text-3xl font-bold mt-2">{data.distribution.find(d => d.name === 'Fake')?.value || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">Prediction Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-200">Activity Timeline</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.timeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" allowDecimals={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="REAL" name="Real" stackId="a" fill="#3b82f6" />
                <Bar dataKey="FAKE" name="Fake" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Face Analysis Summary Section (Separate Section) */}
      <div className="mt-12 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          Deepfake Face Analysis Summary
        </h2>

        {/* Face Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
              <ScanFace size={22} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{data.face_stats?.total_faces ?? 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Faces Detected</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-red-100 dark:border-red-900/40 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} className="text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{data.face_stats?.suspicious ?? 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Suspicious Faces</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={22} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{data.face_stats?.no_issue ?? 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">No Issue Faces</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <UserX size={22} className="text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{data.face_stats?.no_face ?? 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">No Face Detected</p>
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Face Detection Presence */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-6 text-gray-700 dark:text-gray-300">Face Detection Presence</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Face Detected', value: data.face_stats?.total_faces || 0 },
                      { name: 'No Face', value: data.face_stats?.no_face || 0 }
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#6366f1" stroke="none" />
                    <Cell fill="#94a3b8" stroke="none" opacity={0.5} />
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Facial Suspicion Breakdown */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-6 text-gray-700 dark:text-gray-300">Facial Suspicion Breakdown</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Natural / No Issue', value: data.face_stats?.no_issue || 0, color: '#10b981' },
                  { name: 'Suspicious Artifacts', value: data.face_stats?.suspicious || 0, color: '#ef4444' }
                ]} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.05} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" name="Images" radius={[0, 8, 8, 0]} barSize={40}>
                    {
                      [
                        { name: 'Natural / No Issue', value: data.face_stats?.no_issue || 0, color: '#10b981' },
                        { name: 'Suspicious Artifacts', value: data.face_stats?.suspicious || 0, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-4 italic text-center leading-relaxed">
              * "Suspicious Artifacts" aggregates detections flagged as Suspicious or Highly Suspicious due to texture, lighting, or boundary inconsistencies.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Analytics;
