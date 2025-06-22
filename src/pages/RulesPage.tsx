import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Users, Heart, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';

export const RulesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            SaudeMAX Rules & Guidelines
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Understanding our health sharing community guidelines and how we work together to support each other's healthcare needs.
          </p>
        </motion.div>

        {/* Key Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Core Principles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Transparency',
                description: 'Clear guidelines and open communication about all sharing decisions'
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Members supporting members through shared healthcare costs'
              },
              {
                icon: Heart,
                title: 'Compassion',
                description: 'Caring for one another with empathy and understanding'
              },
              {
                icon: FileText,
                title: 'Accountability',
                description: 'Responsible stewardship of shared healthcare resources'
              }
            ].map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <principle.icon className="w-8 h-8 text-blue-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{principle.title}</h3>
                  <p className="text-gray-600">{principle.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rules Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Important Guidelines</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligible Medical Expenses</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Emergency medical care</li>
                  <li>• Preventive care and wellness visits</li>
                  <li>• Prescription medications</li>
                  <li>• Specialist consultations</li>
                  <li>• Diagnostic tests and imaging</li>
                  <li>• Surgical procedures</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sharing Process</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Submit requests within 90 days</li>
                  <li>• Provide complete documentation</li>
                  <li>• Review process takes 5-10 business days</li>
                  <li>• Appeals process available</li>
                  <li>• Direct payment to providers when possible</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Cognito Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Complete Rules & Guidelines Form
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Please review and acknowledge our complete rules and guidelines below.
            </p>
            
            {/* Form Container with iframe */}
            <div className="w-full">
              <div className="relative w-full" style={{ minHeight: '800px' }}>
                <iframe 
                  src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/439" 
                  allow="payment" 
                  style={{
                    border: 0,
                    width: '100%',
                    height: '800px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  title="SaudeMAX Rules and Guidelines Form"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Alternative access option */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Need to open the form in a new window?
                  </h3>
                  <p className="text-blue-800 text-sm">
                    If you prefer to fill out the form in a separate tab or are experiencing display issues.
                  </p>
                </div>
                <a 
                  href="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/439"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Form
                </a>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Questions About Our Rules?
            </h3>
            <p className="text-gray-600 mb-6">
              Our member services team is here to help clarify any guidelines or answer your questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@saudemax.com"
                className="inline-flex items-center px-6 py-3 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
              >
                Email Support
              </a>
              <a 
                href="tel:+5511999999999"
                className="inline-flex items-center px-6 py-3 border border-blue-700 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Call Us
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};