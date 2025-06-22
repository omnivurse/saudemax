import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// Declare Accept.js types
declare global {
  interface Window {
    Accept: {
      dispatchData: (
        data: {
          authData: {
            clientKey: string;
            apiLoginID: string;
          };
          cardData: {
            cardNumber: string;
            month: string;
            year: string;
            cardCode: string;
            zip: string;
          };
        },
        callback: (response: any) => void
      ) => void;
    };
  }
}

interface PaymentFormProps {
  planId: string;
  planName: string;
  monthlyAmount: number;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
}

interface FormData {
  email: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  zip: string;
  firstName: string;
  lastName: string;
}

export const AuthorizePaymentForm: React.FC<PaymentFormProps> = ({
  planId,
  planName,
  monthlyAmount,
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: '',
    zip: '',
    firstName: '',
    lastName: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [acceptJsLoaded, setAcceptJsLoaded] = useState(false);

  // Load Accept.js script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://jstest.authorize.net/v1/Accept.js'; // Use production URL for live
    script.async = true;
    script.onload = () => setAcceptJsLoaded(true);
    script.onerror = () => {
      setStatus({
        type: 'error',
        message: 'Failed to load payment processor. Please refresh and try again.'
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formatted.replace(/\s/g, '').length <= 16) {
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      return;
    }
    
    // Limit CVV to 4 digits
    if (name === 'cvv' && value.length > 4) return;
    
    // Limit month to 2 digits
    if (name === 'expMonth' && (value.length > 2 || parseInt(value) > 12)) return;
    
    // Limit year to 2 digits
    if (name === 'expYear' && value.length > 2) return;
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const { email, cardNumber, expMonth, expYear, cvv, zip, firstName, lastName } = formData;
    
    if (!email || !cardNumber || !expMonth || !expYear || !cvv || !zip || !firstName || !lastName) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return false;
    }
    
    if (cardNumber.replace(/\s/g, '').length < 13) {
      setStatus({ type: 'error', message: 'Please enter a valid card number.' });
      return false;
    }
    
    if (parseInt(expMonth) < 1 || parseInt(expMonth) > 12) {
      setStatus({ type: 'error', message: 'Please enter a valid expiration month.' });
      return false;
    }
    
    const currentYear = new Date().getFullYear() % 100;
    if (parseInt(expYear) < currentYear) {
      setStatus({ type: 'error', message: 'Card has expired. Please use a valid card.' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptJsLoaded) {
      setStatus({ type: 'error', message: 'Payment processor not ready. Please try again.' });
      return;
    }
    
    if (!validateForm()) return;
    
    setIsProcessing(true);
    setStatus({ type: null, message: '' });

    try {
      const authData = {
        clientKey: import.meta.env.VITE_AUTH_NET_CLIENT_KEY || '',
        apiLoginID: import.meta.env.VITE_AUTH_NET_API_LOGIN_ID || '',
      };

      const cardData = {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        month: formData.expMonth.padStart(2, '0'),
        year: formData.expYear,
        cardCode: formData.cvv,
        zip: formData.zip,
      };

      window.Accept.dispatchData({ authData, cardData }, async (response) => {
        if (response.messages.resultCode === "Error") {
          setStatus({
            type: 'error',
            message: response.messages.message[0].text || 'Payment processing failed.'
          });
          setIsProcessing(false);
          onError?.(response.messages.message[0].text);
          return;
        }

        try {
          const result = await fetch("/api/process-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              opaqueData: response.opaqueData,
              customerInfo: {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName
              },
              planInfo: {
                planId,
                planName,
                monthlyAmount
              }
            })
          });

          const resJson = await result.json();
          
          if (resJson.success) {
            setStatus({
              type: 'success',
              message: 'Subscription created successfully! Welcome to SaudeMAX.'
            });
            onSuccess?.(resJson.subscriptionId);
          } else {
            setStatus({
              type: 'error',
              message: resJson.message || 'Failed to create subscription.'
            });
            onError?.(resJson.message);
          }
        } catch (error) {
          setStatus({
            type: 'error',
            message: 'Network error. Please check your connection and try again.'
          });
          onError?.('Network error');
        } finally {
          setIsProcessing(false);
        }
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
      setIsProcessing(false);
      onError?.('Unexpected error');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Subscribe to {planName}
        </h2>
        <p className="text-gray-600 text-center">
          ${monthlyAmount.toFixed(2)}/month • Secure payment processing
        </p>
      </div>

      {/* Security Notice */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">Secure Payment</span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          Your payment information is encrypted and processed securely through Authorize.Net
        </p>
      </div>

      {/* Status Messages */}
      {status.type && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border ${
            status.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              status.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {status.message}
            </span>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john.doe@example.com"
            />
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Number *
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <input
                type="number"
                name="expMonth"
                value={formData.expMonth}
                onChange={handleInputChange}
                required
                min="1"
                max="12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                name="expYear"
                value={formData.expYear}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV *
              </label>
              <input
                type="number"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12345"
            />
          </div>
        </div>

        {/* Terms */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I agree to the <a href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</a> and 
              authorize SaudeMAX to charge my payment method ${monthlyAmount.toFixed(2)} monthly for my subscription.
            </label>
          </div>
        </div>

        <Button
          type="submit"
          loading={isProcessing}
          disabled={isProcessing || !acceptJsLoaded}
          className="w-full"
          size="lg"
        >
          <Lock className="w-5 h-5 mr-2" />
          {isProcessing ? 'Processing Payment...' : `Subscribe for $${monthlyAmount.toFixed(2)}/month`}
        </Button>
      </form>

      {/* Security Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center space-x-1">
            <Lock className="w-4 h-4" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </Card>
  );
};