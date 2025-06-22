import React from 'react';
import { motion } from 'framer-motion';
import { UserMinus, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { getCurrentImpersonation, endImpersonation } from '../../lib/impersonation';
import { useNavigate } from 'react-router-dom';

export const ImpersonationBanner: React.FC = () => {
  const impersonation = getCurrentImpersonation();
  const navigate = useNavigate();
  
  if (!impersonation) {
    return null;
  }

  const handleEndImpersonation = async () => {
    const result = await endImpersonation();
    
    if (result.success) {
      // Redirect back to admin dashboard
      navigate('/admin');
    } else {
      console.error('Failed to end impersonation:', result.error);
      // Force clear localStorage and redirect anyway
      localStorage.removeItem('saudemax_impersonation');
      navigate('/admin');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-yellow-500 text-white py-2 px-4 fixed top-0 left-0 right-0 z-50 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">
            Impersonating: {impersonation.targetName} ({impersonation.targetEmail}) - {impersonation.targetRole.toUpperCase()}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleEndImpersonation}
          className="bg-white text-yellow-700 hover:bg-yellow-100"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          End Impersonation
        </Button>
      </div>
    </motion.div>
  );
};