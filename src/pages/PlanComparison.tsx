import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, Filter, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { HealthPlan } from '../types';

interface Plan {
  id: string;
  name: string;
  tier: string;
  price: string;
  iua: string;
  features: string[];
  popular?: boolean;
}

const plans1500: Plan[] = [
  {
    id: 'member-only-1500',
    name: 'Member Only',
    tier: 'Essential',
    price: '$268',
    iua: '1500',
    features: [
      'Basic medical coverage',
      'Emergency care',
      'Prescription assistance',
      'Telehealth services',
      'IUA: $1,500'
    ]
  },
  {
    id: 'member-spouse-1500',
    name: 'Member + Spouse',
    tier: 'Complete',
    price: '$448',
    iua: '1500',
    features: [
      'Comprehensive coverage',
      'Specialist care',
      'Preventive services',
      'Dental & vision',
      'IUA: $1,500'
    ],
    popular: true
  },
  {
    id: 'member-child-1500',
    name: 'Member + Child',
    tier: 'Premium',
    price: '$448',
    iua: '1500',
    features: [
      'All-inclusive coverage',
      'Worldwide care',
      'Alternative medicine',
      'Priority support',
      'IUA: $1,500'
    ]
  },
  {
    id: 'member-family-1500',
    name: 'Member + Family',
    tier: 'Family',
    price: '$633',
    iua: '1500',
    features: [
      'Complete family coverage',
      'Maternity benefits',
      'Pediatric care',
      'Family wellness programs',
      'IUA: $1,500'
    ]
  }
];

const plans3000: Plan[] = [
  {
    id: 'member-only-3000',
    name: 'Member Only',
    tier: 'Essential',
    price: '$258',
    iua: '3000',
    features: [
      'Basic medical coverage',
      'Emergency care',
      'Prescription assistance',
      'Telehealth services',
      'IUA: $3,000'
    ]
  },
  {
    id: 'member-spouse-3000',
    name: 'Member + Spouse',
    tier: 'Complete',
    price: '$300',
    iua: '3000',
    features: [
      'Comprehensive coverage',
      'Specialist care',
      'Preventive services',
      'Dental & vision',
      'IUA: $3,000'
    ],
    popular: true
  },
  {
    id: 'member-child-3000',
    name: 'Member + Child',
    tier: 'Premium',
    price: '$358',
    iua: '3000',
    features: [
      'All-inclusive coverage',
      'Worldwide care',
      'Alternative medicine',
      'Priority support',
      'IUA: $3,000'
    ]
  },
  {
    id: 'member-family-3000',
    name: 'Member + Family',
    tier: 'Family',
    price: '$545',
    iua: '3000',
    features: [
      'Complete family coverage',
      'Maternity benefits',
      'Pediatric care',
      'Family wellness programs',
      'IUA: $3,000'
    ]
  }
];

const plans6000: Plan[] = [
  {
    id: 'member-only-6000',
    name: 'Member Only',
    tier: 'Essential',
    price: '$180',
    iua: '6000',
    features: [
      'Basic medical coverage',
      'Emergency care',
      'Prescription assistance',
      'Telehealth services',
      'IUA: $6,000'
    ]
  },
  {
    id: 'member-spouse-6000',
    name: 'Member + Spouse',
    tier: 'Complete',
    price: '$178',
    iua: '6000',
    features: [
      'Comprehensive coverage',
      'Specialist care',
      'Preventive services',
      'Dental & vision',
      'IUA: $6,000'
    ],
    popular: true
  },
  {
    id: 'member-child-6000',
    name: 'Member + Child',
    tier: 'Premium',
    price: '$268',
    iua: '6000',
    features: [
      'All-inclusive coverage',
      'Worldwide care',
      'Alternative medicine',
      'Priority support',
      'IUA: $6,000'
    ]
  },
  {
    id: 'member-family-6000',
    name: 'Member + Family',
    tier: 'Family',
    price: '$445',
    iua: '6000',
    features: [
      'Complete family coverage',
      'Maternity benefits',
      'Pediatric care',
      'Family wellness programs',
      'IUA: $6,000'
    ]
  }
];

export const PlanComparison: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'individual' | 'family'>('all');
  const [selectedIUA, setSelectedIUA] = useState<'1500' | '3000' | '6000'>('1500');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allPlans = {
    '1500': plans1500,
    '3000': plans3000,
    '6000': plans6000
  };

  const filteredPlans = useMemo(() => {
    const currentPlans = allPlans[selectedIUA];
    
    if (selectedFilter === 'all') return currentPlans;
    if (selectedFilter === 'individual') return currentPlans.filter(plan => plan.name === 'Member Only');
    return currentPlans.filter(plan => plan.name !== 'Member Only');
  }, [selectedFilter, selectedIUA]);

  const filters = [
    { key: 'all' as const, label: t('plans.filters.all') },
    { key: 'individual' as const, label: t('plans.filters.individual') },
    { key: 'family' as const, label: t('plans.filters.family') }
  ];

  const handleSelectPlan = (planId: string) => {
    const selectedPlan = filteredPlans.find(plan => plan.id === planId);
    if (selectedPlan) {
      // Store selected plan in sessionStorage for the enrollment form
      sessionStorage.setItem('selectedPlan', JSON.stringify({
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planType: selectedPlan.name === 'Member Only' ? 'individual' : 'family',
        monthlyAmount: parseFloat(selectedPlan.price.replace('$', '')),
        annualAmount: Math.round(parseFloat(selectedPlan.price.replace('$', '')) * 12 * 0.9), // 10% discount for annual
        benefits: selectedPlan.features,
        iua: selectedPlan.iua
      }));
      
      // Navigate to enrollment with plan pre-selected
      navigate('/enrollment');
    }
  };

  const handlePlanClick = (planId: string) => {
    setSelectedPlanId(planId);
    setLoading(true);
    setTimeout(() => {
      handleSelectPlan(planId);
    }, 500); // 500ms to show spinner and allow visual feedback
  };

  const tierIcons = {
    "Member Only": "👤",
    "Member + Spouse": "🧑‍🤝‍🧑",
    "Member + Child": "👨‍👧",
    "Member + Family": "👨‍👩‍👧‍👦"
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: loading ? 0.3 : 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('plans.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('plans.subtitle')}
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedFilter === filter.key
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Filter className="w-4 h-4 inline mr-2" />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* IUA Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-12"
          >
            <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                {['1500', '3000', '6000'].map((iua) => (
                  <button
                    key={iua}
                    onClick={() => setSelectedIUA(iua as '1500' | '3000' | '6000')}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      selectedIUA === iua
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    IUA ${iua}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedFilter}-${selectedIUA}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {filteredPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                  style={{ zIndex: 20 }}
                >
                  <div
                    className={`relative h-full transition-all duration-300 cursor-pointer ${
                      plan.popular ? 'ring-2 ring-blue-700 shadow-xl' : 'hover:shadow-lg'
                    } ${selectedPlanId === plan.id ? 'ring-4 ring-green-600 shadow-2xl' : ''} bg-white rounded-xl border border-gray-200 p-6 ${
                      loading ? 'pointer-events-none' : ''
                    }`}
                    onClick={() => !loading && handlePlanClick(plan.id)}
                    style={{ 
                      zIndex: 20, 
                      position: 'relative',
                      pointerEvents: loading ? 'none' : 'auto'
                    }}
                  >
                    {/* Selection Indicator */}
                    {selectedPlanId === plan.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 ring-4 ring-green-600 rounded-xl pointer-events-none bg-green-50/20"
                      />
                    )}

                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                          <Star className="w-4 h-4 mr-1 fill-current" />
                          {t('plans.card.popular')}
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {tierIcons[plan.name as keyof typeof tierIcons]}{' '}
                        {plan.name}
                      </h3>
                      <div className="text-3xl font-bold text-blue-700 mb-2">
                        {plan.price}
                        <span className="text-lg text-gray-600 font-normal">
                          {t('plans.card.monthly')}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        {t('plans.card.deductible')}: ${plan.iua}
                      </p>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {t('plans.card.benefits')}:
                      </h4>
                      <ul className="space-y-2 mb-6">
                        {plan.features.slice(0, 4).map((benefit, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{benefit}</span>
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-blue-700 text-sm font-medium">
                            +{plan.features.length - 4} more benefits
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="mt-auto space-y-3">
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'primary' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!loading) {
                            handlePlanClick(plan.id);
                          }
                        }}
                        disabled={loading}
                        style={{ zIndex: 30, position: 'relative' }}
                      >
                        {selectedPlanId === plan.id ? 'Selecting...' : t('plans.card.select')}
                      </Button>
                      <button 
                        className="w-full text-blue-700 hover:text-blue-800 font-medium text-sm disabled:opacity-50"
                        onClick={(e) => e.stopPropagation()}
                        disabled={loading}
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-16"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help Choosing?
              </h3>
              <p className="text-gray-600 mb-6">
                Our healthcare advisors are here to help you find the perfect plan for your needs and budget.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" disabled={loading}>
                  Schedule Consultation
                </Button>
                <Button disabled={loading}>
                  Call (561) 466-9558
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Full Screen Loader */}
      <AnimatePresence>
        {loading && <FullScreenLoader />}
      </AnimatePresence>
    </>
  );
};