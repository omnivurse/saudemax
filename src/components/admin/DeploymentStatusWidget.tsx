import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface DeploymentStatus {
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  message: string;
  lastUpdated: string;
  deploymentId?: string;
  deployUrl?: string;
  claimed?: boolean;
  claim_url?: string;
}

export const DeploymentStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeploymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke(
        'getDeploymentStatus',
        {
          method: 'GET'
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data?.success && data?.data) {
        setStatus(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching deployment status:', err);
      setError(err.message || 'Failed to fetch deployment status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentStatus();
    
    // Poll for updates every 30 seconds if deployment is in progress
    const interval = setInterval(() => {
      if (status?.status === 'in_progress') {
        fetchDeploymentStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [status?.status]);

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`${getStatusColor()} border`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Deployment Status</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchDeploymentStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error ? (
          <div className="bg-red-100 text-red-800 p-3 rounded-md">
            {error}
          </div>
        ) : loading && !status ? (
          <div className="flex items-center space-x-3 py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Checking deployment status...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <div className="font-medium">
                  {status?.status === 'idle' ? 'No Active Deployment' : 
                   status?.status === 'in_progress' ? 'Deployment in Progress' :
                   status?.status === 'completed' ? 'Deployment Completed' :
                   'Deployment Failed'}
                </div>
                <div className="text-sm text-gray-600">{status?.message}</div>
              </div>
            </div>

            {status?.lastUpdated && (
              <div className="text-xs text-gray-500">
                Last updated: {new Date(status.lastUpdated).toLocaleString()}
              </div>
            )}

            {status?.deployUrl && (
              <div className="pt-2">
                <a 
                  href={status.deployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Deployed Site
                </a>
              </div>
            )}

            {status?.claim_url && (
              <div className="pt-2">
                <a 
                  href={status.claim_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Claim This Deployment
                </a>
              </div>
            )}

            {status?.claimed && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                A new site with a new URL was deployed.
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};