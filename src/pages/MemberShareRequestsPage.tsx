import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Plus, 
  Filter, 
  Search, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download
} from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import { Sidebar } from '../components/ui/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface ShareRequest {
  id: string;
  requestNumber: string;
  type: string;
  provider: string;
  serviceDate: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid';
  submittedDate: string;
}

const mockShareRequests: ShareRequest[] = [
  {
    id: '1',
    requestNumber: 'SR-2025-001',
    type: 'Medical',
    provider: 'City Hospital',
    serviceDate: '2025-05-15',
    requestedAmount: 1250,
    approvedAmount: 1100,
    status: 'approved',
    submittedDate: '2025-05-20'
  },
  {
    id: '2',
    requestNumber: 'SR-2025-002',
    type: 'Dental',
    provider: 'Smile Dental Clinic',
    serviceDate: '2025-06-01',
    requestedAmount: 450,
    status: 'under_review',
    submittedDate: '2025-06-05'
  },
  {
    id: '3',
    requestNumber: 'SR-2025-003',
    type: 'Prescription',
    provider: 'MedPlus Pharmacy',
    serviceDate: '2025-06-10',
    requestedAmount: 120,
    status: 'submitted',
    submittedDate: '2025-06-12'
  }
];

export const MemberShareRequestsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const filteredRequests = mockShareRequests.filter(request => {
    // Filter by status
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.provider.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'under_review': return <Clock className="w-4 h-4" />;
      case 'submitted': return <FileText className="w-4 h-4" />;
      case 'denied': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="h-full sticky top-0">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Share Requests</h1>
            <div className="w-5"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Desktop Header */}
            <div className="hidden lg:flex lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Share Requests</h1>
                <p className="text-gray-600">Submit and track your medical expense sharing requests</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>

            {/* Mobile New Request Button */}
            <div className="lg:hidden mb-4">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Share Requests List */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <Card className="p-6 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Share Requests Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters to see more results.'
                      : 'You haven\'t submitted any share requests yet.'}
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </Card>
              ) : (
                filteredRequests.map((request) => {
                  const StatusIcon = getStatusIcon(request.status);
                  
                  return (
                    <Card key={request.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div className="mb-2 md:mb-0">
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">{request.requestNumber}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(request.status)}`}>
                              <StatusIcon className="mr-1" />
                              {request.status.replace('_', ' ').charAt(0).toUpperCase() + request.status.replace('_', ' ').slice(1)}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{request.provider} • {request.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">${request.requestedAmount.toLocaleString()}</p>
                          {request.approvedAmount && (
                            <p className="text-sm text-green-600">
                              Approved: ${request.approvedAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center mb-2 sm:mb-0">
                          <Clock className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            Submitted: {new Date(request.submittedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Documents
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};