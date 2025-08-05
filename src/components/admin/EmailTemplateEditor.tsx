import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  Eye, 
  Code, 
  Mail,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface EmailTemplateEditorProps {
  templateId?: string;
  onSave: (template: {
    id: string;
    subject: string;
    html_body: string;
    description?: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    id: string;
    subject: string;
    html_body: string;
    description?: string;
  };
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  templateId,
  onSave,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    id: '',
    subject: '',
    html_body: '',
    description: ''
  });
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      
      // Extract placeholders from the template to generate preview data
      const placeholders = extractPlaceholders(initialData.html_body);
      const initialPreviewData: Record<string, string> = {};
      
      placeholders.forEach(placeholder => {
        initialPreviewData[placeholder] = `[${placeholder}]`;
      });
      
      setPreviewData(initialPreviewData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If changing the HTML body, update preview data with new placeholders
    if (name === 'html_body') {
      const placeholders = extractPlaceholders(value);
      const newPreviewData: Record<string, string> = {};
      
      placeholders.forEach(placeholder => {
        // Keep existing values if they exist
        newPreviewData[placeholder] = previewData[placeholder] || `[${placeholder}]`;
      });
      
      setPreviewData(newPreviewData);
    }
  };

  const handlePreviewDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPreviewData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Validate form data
      if (!formData.id.trim()) {
        throw new Error('Template ID is required');
      }
      
      if (!formData.subject.trim()) {
        throw new Error('Subject is required');
      }
      
      if (!formData.html_body.trim()) {
        throw new Error('HTML body is required');
      }
      
      // Validate template ID format (lowercase, alphanumeric, hyphens only)
      if (!/^[a-z0-9-]+$/.test(formData.id)) {
        throw new Error('Template ID must contain only lowercase letters, numbers, and hyphens');
      }
      
      // Validate template syntax
      try {
        // Check for unclosed mustache tags
        const openTags = (formData.html_body.match(/{{\s*[^}]+/g) || []).length;
        const closeTags = (formData.html_body.match(/}}/g) || []).length;
        
        if (openTags !== closeTags) {
          throw new Error('Template has unclosed mustache tags');
        }
      } catch (syntaxError: any) {
        throw new Error(`Template syntax error: ${syntaxError.message}`);
      }
      
      setSaving(true);
      await onSave(formData);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const renderPreview = () => {
    let previewHtml = formData.html_body;
    
    // Replace placeholders with preview data
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      previewHtml = previewHtml.replace(regex, value);
    });
    
    return previewHtml;
  };

  return (
    <Card className="p-6 border-blue-200 bg-blue-50">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-blue-900">
          {templateId ? 'Edit Template' : 'Create New Template'}
        </h2>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form */}
        <div className="w-full lg:w-1/2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template ID *
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                disabled={!!templateId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="welcome-email"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use a unique identifier with only lowercase letters, numbers, and hyphens
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Welcome to SaudeMAX!"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Welcome email for new members"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTML Body *
              </label>
              <textarea
                name="html_body"
                value={formData.html_body}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="<html><body><h1>Welcome {{name}}!</h1></body></html>"
                rows={15}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use {{mustache}} syntax for dynamic content (e.g., {{full_name}}, {{email}})
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {templateId ? 'Update Template' : 'Save Template'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <Code className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {showPreview ? 'Show Code' : 'Preview'}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showPreview ? 'Preview' : 'Template Variables'}
            </h3>
            
            {showPreview ? (
              <div className="h-[500px] overflow-auto">
                <iframe
                  srcDoc={renderPreview()}
                  title="Email Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  These variables will be replaced with actual data when the email is sent:
                </p>
                
                {Object.keys(previewData).length > 0 ? (
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
                          placeholder={`Value for ${key}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No template variables found</p>
                    <p className="text-sm">Add variables using {{variable_name}} syntax</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};