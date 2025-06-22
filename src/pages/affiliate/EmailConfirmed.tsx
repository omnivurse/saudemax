import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const EmailConfirmed: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <CheckCircle className="text-green-600 w-16 h-16" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Email Confirmed!</h1>
        <p className="text-gray-600 text-lg mb-6">
          Your account has been verified. You can now access your affiliate dashboard and start referring!
        </p>
        <Button asChild className="w-full max-w-xs">
          <Link to="/agent">Go to Dashboard</Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default EmailConfirmed;