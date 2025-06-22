import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthorizePaymentForm } from '../components/payment/AuthorizePaymentForm';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Mock plan data - replace with actual data from your plans
const PLANS = {
  'essential-individual': {
    id: 'essential-individual',
    name: 'Essential Individual',
    monthlyAmount: 199,
    features: ['Emergency care', 'Primary care', 'Prescription coverage', 'Telehealth']
  },
  'complete-individual': {
    id: 'complete-individual',
    name: 'Complete Individual',
    monthlyAmount: 349,
    features: ['All Essential benefits', 'Specialist care', 'Preventive care', 'Mental health']
  },
  'premium-individual': {
    id: 'premium-individual',
    name: 'Premium Individual',
    monthlyAmount: 499,
    features: ['All Complete benefits', 'Worldwide coverage', 'Concierge services']
  }
};

export const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string>('');

  const planId = searchParams.get('planId') || 'complete-individual';
  const plan = PLANS[planId as keyof typeof PLANS] || PLANS['complete-individual'];

  const handlePaymentSuccess = (subId: string) => {
    setSubscriptionId(subId);
    setPaymentComplete(true);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Handle error - maybe show a toast or redirect
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to SaudeMAX!
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Your subscription to <strong>{plan.name}</strong> has been successfully created.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                <ul className="text-blue-800 text-sm space-y-2 text-left">
                  <li>• You'll receive a confirmation email within 5 minutes</li>
                  <li>• Your member ID card will be available in your portal</li>
                  <li>• Access to telehealth services starts immediately</li>
                  <li>• Your advisor will contact you within 24 hours</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/member/dashboard')}
                  className="w-full"
                  size="lg"
                >
                  Access Member Portal
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Return to Homepage
                </Button>
              </div>
              
              {subscriptionId && (
                <p className="text-xs text-gray-500 mt-6">
                  Subscription ID: {subscriptionId}
                </p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-gray-600">
            You're just one step away from joining the SaudeMAX community
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-blue-700">
                    ${plan.monthlyAmount}
                    <span className="text-sm text-gray-600 font-normal">/month</span>
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Included Benefits:</h5>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Monthly Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${plan.monthlyAmount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Billed monthly • Cancel anytime
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <AuthorizePaymentForm
              planId={plan.id}
              planName={plan.name}
              monthlyAmount={plan.monthlyAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};