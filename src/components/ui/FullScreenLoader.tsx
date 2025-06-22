import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const FullScreenLoader: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center"
  >
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-gray-600 font-medium"
      >
        Preparing your enrollment...
      </motion.p>
    </div>
  </motion.div>
);