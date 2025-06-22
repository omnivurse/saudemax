import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Edit, 
  Trash2, 
  Plus, 
  Eye,
  Search,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { EmailTemplateEditor } from './EmailTemplateEditor';

interface EmailTemplate {
  id: string;
  subject: string;
  html_body: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const EmailTemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Filter templates based on search term
    if (searchTerm) {
      const filtered = templates.filter(template => 
        template.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTemplates(filtered);
    } else {
      setFilteredTemplates(templates);
    }
  }, [searchTerm, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .order('id');

      if (fetchError) {
        throw fetchError;
      }

      setTemplates(data || []);
      setFilteredTemplates(data || []);
    } catch (err: any) {
      console.error('Error fetching email templates:', err);
      setError(err.message || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(`Are you sure you want to delete the template "${id}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess(`Template "${id}" deleted successfully`);
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template: {
    id: string;
    subject: string;
    html_body: string;
    description?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const isUpdate = !!editingTemplate;

      if (isUpdate) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('email_templates')
          .update({
            subject: template.subject,
            html_body: template.html_body,
            description: template.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess(`Template "${template.id}" updated successfully`);
      } else {
        // Create new template
        const { error: insertError } = await supabase
          .from('email_templates')
          .insert({
            id: template.id,
            subject: template.subject,
            html_body: template.html_body,
            description: template.description
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess(`Template "${template.id}" created successfully`);
      }

      setShowEditor(false);
      fetchTemplates();
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || 'Failed to save template');
      throw err; // Re-throw to be caught by the editor
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    setShowPreview(template.id);
    
    // Generate sample data for preview
    const placeholders = extractPlaceholders(template.html_body);
    const sampleData: Record<string, string> = {};
    
    placeholders.forEach(placeholder => {
      // Generate appropriate sample data based on placeholder name
      if (placeholder.includes('name')) {
        sampleData[placeholder] = 'John Doe';
      } else if (placeholder.includes('email')) {
        sampleData[placeholder] = 'john.doe@example.com';
      } else if (placeholder.includes('amount')) {
        sampleData[placeholder] = '100.00';
      } else if (placeholder.includes('date')) {
        sampleData[placeholder] = new Date().toLocaleDateString();
      } else if (placeholder.includes('code')) {
        sampleData[placeholder] = 'ABC123';
      } else if (placeholder.includes('link') || placeholder.includes('url')) {
        sampleData[placeholder] = 'https://example.com';
      } else if (placeholder.includes('status')) {
        sampleData[placeholder] = 'active';
      } else {
        sampleData[placeholder] = `[${placeholder}]`;
      }
    });
    
    setPreviewData(sampleData);
  };

  const extractPlaceholders = (template: string): string[] => {
    const placeholderRegex = /{{([^{}]+)}}/g;
    const matches = template.match(placeholderRegex) || [];
    return matches
      .map(match => match.replace(/{{|}}/g, '').trim())
      .filter(placeholder => !placeholder.startsWith('#') && !placeholder.startsWith('/'));
  };

  const renderPreview = (template: EmailTemplate) => {
    let previewHtml = template.html_body;
    
    // Replace placeholders with preview data
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      previewHtml = previewHtml.replace(regex, value);
    });
    
    return previewHtml;
  };

  const handlePreviewDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPreviewData(prev => ({ ...prev, [name]: value }));
  };

  const sendTestEmail = async (template: EmailTemplate) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error('User email not available');
      }

      // Send test email
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          to: user.email,
          template_id: template.id,
          data: previewData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }

      setSuccess(`Test email sent to ${user.email}`);
    } catch (err: any) {
      console.error('Error sending test email:', err);
      setError(err.message || 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Email Templates</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchTemplates}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Template Editor */}
      {showEditor && (
        <EmailTemplateEditor
          templateId={editingTemplate?.id}
          initialData={editingTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview: {templates.find(t => t.id === showPreview)?.subject}
              </h3>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Preview Data Form */}
              <div className="w-full md:w-1/3 p-4 border-r border-gray-200 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-4">Preview Data</h4>
                <div className="space-y-3">
                  {Object.keys(previewData).map(key => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        name={key}
                        value={previewData[key]}
                        onChange={handlePreviewDataChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => sendTestEmail(templates.find(t => t.id === showPreview)!)}
                    disabled={loading}
                    loading={loading}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </div>
              
              {/* Email Preview */}
              <div className="w-full md:w-2/3 p-4 overflow-y-auto bg-gray-50">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full overflow-y-auto">
                  <iframe
                    srcDoc={renderPreview(templates.find(t => t.id === showPreview)!)}
                    title="Email Preview"
                    className="w-full h-full"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Templates List */}
      {loading && templates.length === 0 ? (
        <Card className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Email Templates</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No templates match your search criteria.' : 'Create your first email template to get started.'}
            </p>
            <Button onClick={handleCreateTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{template.id}</h3>
                  </div>
                  <p className="text-gray-600 mt-1">{template.subject}</p>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Template Guide */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Email Template Guide</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Template Variables</h4>
            <p className="text-blue-700 text-sm mb-2">
              Use {{mustache}} syntax for dynamic content:
            </p>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="text-sm font-mono">
                Hello &#123;&#123;full_name&#125;&#125;,<br />
                Your code is: &#123;&#123;affiliate_code&#125;&#125;
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Common Variables</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• &#123;&#123;full_name&#125;&#125; - Recipient's full name</li>
              <li>• &#123;&#123;email&#125;&#125; - Recipient's email address</li>
              <li>• &#123;&#123;affiliate_code&#125;&#125; - Affiliate's unique code</li>
              <li>• &#123;&#123;referral_link&#125;&#125; - Full referral URL</li>
              <li>• &#123;&#123;dashboard_url&#125;&#125; - Link to dashboard</li>
              <li>• &#123;&#123;amount&#125;&#125; - Payment/commission amount</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};