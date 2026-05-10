import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import ResultDisplay from '../components/ResultDisplay';
import { motion } from 'framer-motion';

const Results = () => {
  const location = useLocation();
  const { resultData } = location.state || {};

  if (!resultData) {
    return <Navigate to="/upload" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12"
    >
      <ResultDisplay resultData={resultData} />
    </motion.div>
  );
};

export default Results;
