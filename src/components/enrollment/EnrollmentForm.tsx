import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Step1Plan } from './Step1Plan';
import { Step2Primary } from './Step2Primary';
import { Step3Address } from './Step3Address';
import { Step4Dependents } from './Step4Dependents';
import { Step5Payment } from './Step5Payment';
import { Card } from '../ui/Card';

export interface EnrollmentData {
  plan: {
    planId: string;
    planName: string;
    planType: 'individual' | 'family';
    frequency: 'monthly' | 'annual';
    monthlyAmount: number;
  };
  primary: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    ssn: string;
    phone: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dependents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    relationship: string;
    gender: string;
  }>;
  payment: {
    subscriptionId?: string;
    completed: boolean;
  };
}

const initialFormData: EnrollmentData = {
  plan: {
    planId: '',
    planName: '',
    planType: 'individual',
    frequency: 'monthly',
    monthlyAmount: 0
  },
  primary: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    ssn: '',
    phone: '',
    email: ''
  },
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  },
  dependents: [],
  payment: {
    completed: false
  }
};

const steps = [
  { number: 1, title: 'Choose Plan', description: 'Select your coverage' },
  { number: 2, title: 'Personal Info', description: 'Primary member details' },
  { number: 3, title: 'Address', description: 'Contact information' },
  { number: 4, title: 'Dependents', description: 'Family members' },
  { number: 5, title: 'Payment', description: 'Complete enrollment' }
];

export const EnrollmentForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EnrollmentData>(initialFormData);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const updateData = <K extends keyof EnrollmentData>(
    section: K,
    data: Partial<EnrollmentData[K]>
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      updateData,
      nextStep,
      prevStep
    };

    switch (currentStep) {
      case 1:
        return <Step1Plan {...stepProps} />;
      case 2:
        return <Step2Primary {...stepProps} />;
      case 3:
        return <Step3Address {...stepProps} />;
      case 4:
        return <Step4Dependents {...stepProps} />;
      case 5:
        return <Step5Payment {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Join SaudeMAX Today
          </h1>
          <p className="text-xl text-gray-600">
            Complete your enrollment in just a few simple steps
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      currentStep >= step.number
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'border-gray-300 text-gray-400 bg-white'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`font-medium text-sm ${
                      currentStep >= step.number ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-all duration-300 ${
                      currentStep > step.number ? 'bg-blue-700' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: isTransitioning ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isTransitioning ? 0 : -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Navigation Footer */}
        {currentStep < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex justify-between items-center"
          >
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
            <div className="text-sm text-gray-500">
              All information is encrypted and secure
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};