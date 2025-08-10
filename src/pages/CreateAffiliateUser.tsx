import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, User, Mail, Lock, CreditCard } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { createAffiliateUser, diagnoseCreateAffiliateFunction } from '../lib/affiliateUtils';

export const CreateAffiliateUser: React.FC = () => {
  const [formData, setFormData] = useState({
    email: 'agentdemo@saudemax.com',
    password: 'DemoAgent123!',
    fullName: 'Agent Demo',
    payoutEmail: 'payout@example.com',
    payoutMethod: 'paypal' as 'paypal' | 'bank_transfer' | 'crypto'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    email: string;
    password: string;
    affiliateCode: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create affiliate user using the utility function
      const result = await createAffiliateUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        payoutEmail: formData.payoutEmail,
        payoutMethod: formData.payoutMethod
      });
      
      console.log("Success response:", result);

      setSuccess({
        message: "Affiliate account created successfully!",
        email: formData.email,
        password: formData.password,
        affiliateCode: result.user.affiliate_code
      });
    } catch (err: any) {
      console.error("Error creating affiliate user:", err);
      setError(err.message || "Failed to create account. Please try again.");
      
      // Run diagnostics if there was a network error
      if (err.message.includes('Failed to fetch')) {
        try {
          const diagResults = await diagnoseCreateAffiliateFunction();
          console.log("Diagnostics:", diagResults);
        } catch (diagErr) {
          console.error("Error running diagnostics:", diagErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Create Affiliate User</h1>
              <p className="text-gray-600 mt-2">Create a new affiliate user for testing</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">{error}</span>
                </div>
              </div>
            )}

            {success ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">{success.message}</span>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <h3 className="font-medium text-gray-900 mb-2">Affiliate Credentials</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> {success.email}</p>
                    <p><strong>Password:</strong> {success.password}</p>
                    <p><strong>Affiliate Code:</strong> {success.affiliateCode}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => window.location.href = '/affiliate-login'}
                    className="w-full"
                  >
                    Go to Login Page
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Payout Email
                  </label>
                  <input
                    type="email"
                    name="payoutEmail"
                    value={formData.payoutEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Payout Method
                  </label>
                  <select
                    name="payoutMethod"
                    value={formData.payoutMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                >
                  Create Affiliate User
                </Button>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateAffiliateUser;