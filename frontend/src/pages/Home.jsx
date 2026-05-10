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
    className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
  >
    <div className={`w-12 h-12 inline-flex items-center justify-center rounded-xl mb-4 ${color}`}>
      <Icon size={22} />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
  </motion.div>
);

/* ─── Quick-action card (logged-in only) ─────────────────────────── */
const ActionCard = ({ icon: Icon, label, sub, to, gradient }) => (
  <motion.div variants={fadeUp(0)}>
    <Link
      to={to}
      className="group flex items-center gap-4 p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/30 dark:border-slate-700/50 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl shrink-0 ${gradient}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
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
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase mb-6 border border-blue-200 dark:border-blue-700/50">
          <Cpu size={13} /> Explainable AI · CNN · Grad-CAM
        </span>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
          CIFAKE
          <span className="block bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent mt-1">
            Synthetic Image Detection
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          An industry-grade tool that tells you whether an image is <strong className="text-gray-900 dark:text-white">real or AI-generated</strong> — and
          <em> shows you exactly why</em> using Gradient Class Activation Maps.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <Zap size={18} /> Get Started — Sign In
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white font-bold text-base hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <Lock size={16} /> Create Free Account
          </Link>
        </div>
      </motion.div>
    </section>

    {/* Stats strip */}
    <motion.section variants={fadeUp(0.1)} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
      {[
        { val: '97.4%', label: 'Model Accuracy' },
        { val: '2 Classes', label: 'Real vs Fake' },
        { val: 'Grad-CAM', label: 'Explainability' },
        { val: 'Real-time', label: 'Inference Speed' },
      ].map(({ val, label }) => (
        <div
          key={label}
          className="text-center py-6 px-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/30 dark:border-slate-700/50 shadow"
        >
          <p className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            {val}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</p>
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
    <motion.div variants={fadeUp(0.2)} className="mb-20 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-6 rounded-r-2xl shadow-sm">
      <div className="flex gap-4">
        <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">Model Limitations &amp; Constraints</h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/80 leading-relaxed">
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
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
              Welcome back
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Hello, <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">{username}</span> 👋
            </h1>
          </div>
        </div>

        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-10">
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
    <motion.div variants={fadeUp(0.15)} className="mb-20 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-6 rounded-r-2xl shadow-sm">
      <div className="flex gap-4">
        <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">Model Limitations &amp; Constraints</h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-200/80 leading-relaxed">
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
