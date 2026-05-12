import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, Brain, Search, Activity, Upload,
  History, BarChart2, GitCompare, Cpu, Zap, Lock, User
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

/* ─── animation helpers ─────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

/* ─── Feature card (shared) ──────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, color, title, desc }) => (
  <motion.div
    variants={fadeUp(0)}
    className="relative bg-blue-50/50 dark:bg-[#ffffff0a] backdrop-blur-md rounded-2xl p-8 border border-blue-100 dark:border-white/10 shadow-xl hover:bg-white/10 transition-all duration-300"
  >
    <div className={`w-12 h-12 inline-flex items-center justify-center rounded-xl mb-6 ${color} shadow-sm`}>
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
    <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">{desc}</p>
  </motion.div>
);

/* ─── Quick-action card (logged-in only) ─────────────────────────── */
const ActionCard = ({ icon: Icon, label, sub, to, gradient }) => (
  <motion.div variants={fadeUp(0)}>
    <Link
      to={to}
      className="group flex items-center gap-4 p-6 rounded-2xl bg-white/70 dark:bg-[#ffffff0a] backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-xl hover:translate-x-1 transition-all duration-300"
    >
      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl shrink-0 ${gradient} shadow-md`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">{sub}</p>
      </div>
    </Link>
  </motion.div>
);

/* ─── LOGGED-OUT landing page ────────────────────────────────────── */
const GuestHome = () => (
  <motion.div
    initial="initial"
    animate="animate"
    variants={stagger}
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  >
    {/* Hero */}
    <section className="relative py-24 text-center overflow-hidden">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute top-0 left-0 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <motion.div variants={fadeUp(0)} className="relative">

        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9] mb-8">
          CIFAKE
          <span className="block bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent mt-2">
            IMAGE ANALYSIS
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
          An industry-grade tool that tells you whether an image is <strong className="text-slate-900 dark:text-white">real or AI-generated</strong> — and
          <em className="text-slate-500 dark:text-gray-300"> shows you exactly why</em> using Gradient Class Activation Maps.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base hover:bg-slate-800 dark:hover:bg-gray-100 hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-slate-900/10 dark:shadow-white/10"
          >
            <Zap size={18} /> Get Started
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-transparent border border-slate-300 dark:border-white/30 text-slate-900 dark:text-white font-bold text-base hover:bg-slate-900/5 dark:hover:bg-white/10 hover:border-slate-900 dark:hover:border-white hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 backdrop-blur-md"
          >
            <Lock size={16} /> Create Account
          </Link>
        </div>
      </motion.div>
    </section>

    {/* Stats strip */}
    <motion.section variants={fadeUp(0.1)} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
      {[
        { val: '97.4%', label: 'Model Accuracy' },
        { val: '2 Classes', label: 'Real vs Fake' },
        { val: 'Grad-CAM', label: 'Explainability' },
        { val: 'Real-time', label: 'Inference Speed' },
      ].map(({ val, label }) => (
        <div
          key={label}
          className="text-center py-8 px-4 rounded-3xl bg-white/70 dark:bg-[#ffffff0a] backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl"
        >
          <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
            {val}
          </p>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-2 font-bold uppercase tracking-widest">{label}</p>
        </div>
      ))}
    </motion.section>

    {/* Feature cards */}
    <motion.section variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      <FeatureCard
        icon={Brain}
        color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
        title="Deep Learning CNN"
        desc="Custom Convolutional Neural Network with Dropout regularisation, trained on 60 000 CIFAKE images for high-fidelity detection."
      />
      <FeatureCard
        icon={Search}
        color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
        title="Explainable AI — Grad-CAM"
        desc="Doesn't just predict — it highlights exactly which pixels drove the decision using Gradient-weighted Class Activation Mapping."
      />
      <FeatureCard
        icon={Activity}
        color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
        title="Personal Analytics"
        desc="Secure per-user history and aggregate analytics so you can track every image you've ever analysed, backed by MongoDB."
      />
    </motion.section>

    {/* Warning banner */}
    <motion.div variants={fadeUp(0.2)} className="mb-20 bg-amber-50 dark:bg-amber-900/20 backdrop-blur-md border-l-4 border-amber-500 p-8 rounded-r-2xl shadow-xl border-y border-r border-amber-200/30 dark:border-none">
      <div className="flex gap-6">
        <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Model Limitations &amp; Constraints</h3>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed font-medium">
            The model was trained on 32×32 pixel images. High-resolution uploads are downscaled before classification.
            Fine-grained artifacts from newer generators (Midjourney v6, DALL-E 3) may be lost in the downscaling process,
            potentially affecting real-world accuracy outside the training distribution.
          </p>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

/* ─── LOGGED-IN dashboard home ───────────────────────────────────── */
const UserHome = ({ username }) => (
  <motion.div
    initial="initial"
    animate="animate"
    variants={stagger}
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  >
    {/* Personalised hero */}
    <section className="relative py-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <motion.div variants={fadeUp(0)} className="relative">
        {/* Avatar + greeting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <User size={28} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Welcome back
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              Hello, <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent tracking-tight">{username}</span>
            </h1>
            <p className="text-xs font-mono text-gray-400 dark:text-slate-500 mt-1">
              Operator Status: Verified · System Active
            </p>
          </div>
        </div>

        <p className="max-w-2xl text-lg text-gray-400 leading-relaxed mb-10">
          Your personal AI image forensics dashboard is ready. Upload an image, explore past results, or dive into your analytics below.
        </p>

        {/* Primary CTA */}
        <Link
          to="/upload"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
        >
          <Upload size={20} /> Analyse a New Image
        </Link>
      </motion.div>
    </section>

    {/* Quick-action grid */}
    <motion.section variants={stagger} className="mb-14">
      <motion.h2 variants={fadeUp(0)} className="text-xl font-bold text-gray-900 dark:text-white mb-5">
        Quick Actions
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard icon={Upload}    label="Analyse Image"      sub="Upload & classify"          to="/upload"      gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <ActionCard icon={History}   label="My History"         sub="Past predictions"           to="/history"     gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        <ActionCard icon={BarChart2} label="Analytics"          sub="Usage & accuracy stats"     to="/analytics"   gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <ActionCard icon={GitCompare} label="Compare Models"   sub="Side-by-side analysis"      to="/compare"     gradient="bg-gradient-to-br from-orange-500 to-pink-600" />
      </div>
    </motion.section>

    {/* Feature info strip */}
    <motion.section variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      <FeatureCard
        icon={Brain}
        color="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
        title="CNN-Powered Detection"
        desc="Custom architecture trained on 60 000 CIFAKE samples. Results available in under a second."
      />
      <FeatureCard
        icon={Search}
        color="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300"
        title="Grad-CAM Heatmap"
        desc="Every prediction comes with a visual explanation showing which regions the model focused on."
      />
      <FeatureCard
        icon={Activity}
        color="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
        title="Your Personal History"
        desc="All analyses are saved securely to your account. Review, compare and export anytime."
      />
    </motion.section>

    {/* Warning banner */}
    <motion.div variants={fadeUp(0.15)} className="mb-20 bg-amber-50 dark:bg-amber-900/20 backdrop-blur-md border-l-4 border-amber-500 p-8 rounded-r-2xl shadow-xl border-y border-r border-amber-200/30 dark:border-none">
      <div className="flex gap-6">
        <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Model Limitations &amp; Constraints</h3>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed font-medium">
            The model was trained on 32×32 pixel images. High-resolution uploads are downscaled before classification.
            Fine-grained artifacts from newer generators (Midjourney v6, DALL-E 3) may be lost in the downscaling process.
          </p>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

/* ─── Root export ────────────────────────────────────────────────── */
const Home = () => {
  const { user } = useContext(AuthContext);

  return user ? <UserHome username={user.username ?? user.name ?? user} /> : <GuestHome />;
};

export default Home;
