import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Eye,
  CreditCard,
  Shield,
  User,
  Folder,
  Upload,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  type: 'id_card' | 'guidelines' | 'invoice' | 'enrollment' | 'certificate' | 'other';
  file_url: string;
  upload_date: string;
  file_size: number;
  is_public: boolean;
  description?: string;
}

export const DocumentsModule: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [memberProfileId, setMemberProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get the member profile ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        console.warn("Fetching profile for user", user.id);
        
        // Use limit(1) instead of single() to avoid PGRST116 error
        const { data: profileData, error: profileError } = await supabase
          .from('member_profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (profileError) {
          throw profileError;
        }

        // Check if we got any results
        if (!profileData || profileData.length === 0) {
          console.warn("No member profile found for user", user.id);
          throw new Error('Member profile not found');
        }

        const profileId = profileData[0].id;
        setMemberProfileId(profileId);

        // Fetch documents
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('member_profile_id', profileId)
          .order('upload_date', { ascending: false });

        if (documentsError) {
          throw documentsError;
        }

        setDocuments(documentsData || []);
        setFilteredDocuments(documentsData || []);
      } catch (err: any) {
        console.error('Error fetching documents:', err);
        setError(err.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    let filtered = documents;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, selectedType, searchTerm]);

  const documentTypes = [
    { key: 'all', label: 'All Documents', icon: Folder },
    { key: 'id_card', label: 'ID Cards', icon: CreditCard },
    { key: 'guidelines', label: 'Guidelines', icon: Shield },
    { key: 'invoice', label: 'Invoices', icon: FileText },
    { key: 'enrollment', label: 'Enrollment', icon: User },
    { key: 'certificate', label: 'Certificates', icon: Shield },
    { key: 'other', label: 'Other', icon: FileText }
  ];

  const getDocumentIcon = (type: string) => {
    const docType = documentTypes.find(t => t.key === type);
    return docType ? docType.icon : FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      if (!documentName) {
        setDocumentName(e.target.files[0].name.split('.')[0]);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile || !documentType || !documentName || !memberProfileId) {
      setUploadError('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      // 1. Upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${memberProfileId}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadFile);

      if (storageError) {
        throw storageError;
      }

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 3. Insert record in documents table
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          member_profile_id: memberProfileId,
          name: documentName,
          type: documentType,
          file_url: publicUrl,
          file_size: uploadFile.size,
          upload_date: new Date().toISOString(),
          is_public: false
        });

      if (insertError) {
        throw insertError;
      }

      // 4. Refresh documents list
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('member_profile_id', memberProfileId)
        .order('upload_date', { ascending: false });

      if (documentsError) {
        throw documentsError;
      }

      setDocuments(documentsData || []);
      setFilteredDocuments(documentsData || []);
      setUploadSuccess(true);
      
      // Reset form
      setUploadFile(null);
      setDocumentType('');
      setDocumentName('');
      
      // Close form after a delay
      setTimeout(() => {
        setShowUploadForm(false);
        setUploadSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.file_url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header and Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
          <p className="text-gray-600 mt-1">Access and manage your important documents</p>
        </div>
        <Button 
          onClick={() => setShowUploadForm(true)} 
          className="mt-4 sm:mt-0"
          disabled={showUploadForm}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 border-blue-200 bg-blue-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Upload New Document</h3>
              <button 
                onClick={() => setShowUploadForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>{uploadError}</p>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>Document uploaded successfully!</p>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select document type</option>
                  <option value="id_card">ID Card</option>
                  <option value="guidelines">Guidelines</option>
                  <option value="invoice">Invoice</option>
                  <option value="enrollment">Enrollment</option>
                  <option value="certificate">Certificate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  {uploadFile ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(uploadFile.size)}</p>
                      <button
                        type="button"
                        onClick={() => setUploadFile(null)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        Drag and drop a file here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        Accepted formats: PDF, PNG, JPG (Max 10MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${uploadFile ? 'pointer-events-none' : ''}`}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={uploading}
                  disabled={uploading || !uploadFile || !documentType || !documentName}
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Document Type Filter */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {documentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.key}
                  onClick={() => setSelectedType(type.key)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedType === type.key
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Documents Grid */}
      {loading ? (
        <Card className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error}
            </h3>
            <Button variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Documents Found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Upload your first document to get started.'}
            </p>
            <Button onClick={() => setShowUploadForm(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => {
            const DocumentIcon = getDocumentIcon(document.type);
            return (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DocumentIcon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{document.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {document.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-gray-600 flex-grow">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Uploaded: {format(new Date(document.upload_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>Size: {formatFileSize(document.file_size)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-auto pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(document.file_url, '_blank')}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Need Help?</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Missing a Document?</h4>
            <p className="text-blue-700 text-sm mb-3">
              Can't find what you're looking for? Contact your advisor for assistance.
            </p>
            <Button size="sm" variant="outline" className="bg-white">Contact Advisor</Button>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Document Questions?</h4>
            <p className="text-blue-700 text-sm mb-3">
              Have questions about your documents or need clarification?
            </p>
            <Button size="sm" variant="outline" className="bg-white">Get Support</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};