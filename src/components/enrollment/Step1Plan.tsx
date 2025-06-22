import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EnrollmentData } from './EnrollmentForm';

interface Step1Props {
  formData: EnrollmentData;
  updateData: <K extends keyof EnrollmentData>(section: K, data: Partial<EnrollmentData[K]>) => void;
  nextStep: () => void;
}

const plans = [
  {
    id: 'essential-individual',
    name: 'Essential Individual',
    type: 'individual' as const,
    monthlyAmount: 199,
    annualAmount: 2148, // 10% discount
    features: [
      'Emergency medical care',
      'Primary care visits',
      'Prescription coverage',
      'Telehealth services',
      'Urgent care'
    ],
    popular: false
  },
  {
    id: 'complete-individual',
    name: 'Complete Individual',
    type: 'individual' as const,
    monthlyAmount: 349,
    annualAmount: 3768, // 10% discount
    features: [
      'All Essential benefits',
      'Specialist consultations',
      'Preventive care',
      'Mental health services',
      'Diagnostic tests',
      'Alternative medicine'
    ],
    popular: true
  },
  {
    id: 'premium-individual',
    name: 'Premium Individual',
    type: 'individual' as const,
    monthlyAmount: 499,
    annualAmount: 5388, // 10% discount
    features: [
      'All Complete benefits',
      'Worldwide coverage',
      'Concierge services',
      'Private room guarantee',
      'Experimental treatments'
    ],
    popular: false
  },
  {
    id: 'essential-family',
    name: 'Essential Family',
    type: 'family' as const,
    monthlyAmount: 449,
    annualAmount: 4848, // 10% discount
    features: [
      'Coverage for up to 6 members',
      'Emergency medical care',
      'Primary care visits',
      'Prescription coverage',
      'Pediatric care'
    ],
    popular: false
  },
  {
    id: 'complete-family',
    name: 'Complete Family',
    type: 'family' as const,
    monthlyAmount: 749,
    annualAmount: 8088, // 10% discount
    features: [
      'All Essential Family benefits',
      'Specialist consultations',
      'Maternity care',
      'Dental and vision',
      'Mental health services'
    ],
    popular: true
  },
  {
    id: 'premium-family',
    name: 'Premium Family',
    type: 'family' as const,
    monthlyAmount: 999,
    annualAmount: 10788, // 10% discount
    features: [
      'All Complete Family benefits',
      'Worldwide coverage',
      'Concierge services',
      'Premium wellness programs',
      'Health coaching'
    ],
    popular: false
  }
];

export const Step1Plan: React.FC<Step1Props> = ({ formData, updateData, nextStep }) => {
  const [selectedPlanId, setSelectedPlanId] = useState(formData.plan.planId);
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>(formData.plan.frequency);
  const [planType, setPlanType] = useState<'individual' | 'family'>('individual');

  // Check for pre-selected plan from sessionStorage
  useEffect(() => {
    const preSelectedPlan = sessionStorage.getItem('selectedPlan');
    if (preSelectedPlan) {
      try {
        const planData = JSON.parse(preSelectedPlan);
        setSelectedPlanId(planData.planId);
        setPlanType(planData.planType);
        
        // Update form data with pre-selected plan
        updateData('plan', {
          planId: planData.planId,
          planName: planData.planName,
          planType: planData.planType,
          frequency: 'monthly',
          monthlyAmount: planData.monthlyAmount
        });
        
        // Clear from sessionStorage after use
        sessionStorage.removeItem('selectedPlan');
      } catch (error) {
        console.error('Error parsing pre-selected plan:', error);
      }
    }
  }, [updateData]);

  const filteredPlans = plans.filter(plan => plan.type === planType);
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  useEffect(() => {
    if (selectedPlan) {
      const amount = frequency === 'monthly' ? selectedPlan.monthlyAmount : selectedPlan.annualAmount;
      updateData('plan', {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planType: selectedPlan.type,
        frequency,
        monthlyAmount: frequency === 'monthly' ? amount : Math.round(amount / 12)
      });
    }
  }, [selectedPlanId, frequency, selectedPlan, updateData]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleNext = () => {
    if (selectedPlan) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <p className="text-gray-600">Select the coverage that best fits your needs and budget</p>
      </div>

      {/* Plan Type Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setPlanType('individual')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              planType === 'individual'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setPlanType('family')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              planType === 'family'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Family
          </button>
        </div>
      </div>

      {/* Frequency Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setFrequency('monthly')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              frequency === 'monthly'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFrequency('annual')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              frequency === 'annual'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual (Save 10%)
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card
              className={`relative cursor-pointer transition-all duration-300 h-full ${
                selectedPlanId === plan.id
                  ? 'ring-2 ring-blue-700 shadow-lg'
                  : 'hover:shadow-md'
              } ${plan.popular ? 'ring-2 ring-blue-700' : ''}`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  ${frequency === 'monthly' ? plan.monthlyAmount : plan.annualAmount}
                  <span className="text-lg text-gray-600 font-normal">
                    /{frequency === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {frequency === 'annual' && (
                  <p className="text-sm text-green-600 font-medium">
                    Save ${(plan.monthlyAmount * 12) - plan.annualAmount} per year
                  </p>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Included Benefits:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <div
                  className={`w-full py-3 px-4 rounded-lg text-center font-medium transition-all ${
                    selectedPlanId === plan.id
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedPlanId === plan.id ? 'Selected' : 'Select Plan'}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Continue Button */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <Button onClick={handleNext} size="lg" className="px-8">
            Continue with {selectedPlan.name}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};