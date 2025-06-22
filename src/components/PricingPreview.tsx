import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  price: string;
  features: string[];
  popular?: boolean;
}

interface PricingPreviewProps {
  showAllLink?: boolean;
  limit?: number;
  iua?: '1500' | '3000' | '6000';
}

const plans: Plan[] = [
  {
    id: 'member-only-1500',
    name: 'Member Only',
    tier: 'Essential',
    price: '$268',
    features: [
      'Basic medical coverage',
      'Emergency care',
      'Prescription assistance',
      'Telehealth services'
    ]
  },
  {
    id: 'member-spouse-1500',
    name: 'Member + Spouse',
    tier: 'Complete',
    price: '$448',
    features: [
      'Comprehensive coverage',
      'Specialist care',
      'Preventive services',
      'Dental & vision'
    ],
    popular: true
  },
  {
    id: 'member-child-1500',
    name: 'Member + Child',
    tier: 'Premium',
    price: '$448',
    features: [
      'All-inclusive coverage',
      'Worldwide care',
      'Alternative medicine',
      'Priority support'
    ]
  },
  {
    id: 'member-family-1500',
    name: 'Member + Family',
    tier: 'Family',
    price: '$633',
    features: [
      'Complete family coverage',
      'Maternity benefits',
      'Pediatric care',
      'Family wellness programs'
    ]
  }
];

const plans3000: Plan[] = [
  {
    id: 'member-only-3000',
    name: 'Member Only',
    tier: 'Essential',
    price: '$258',
    features: [
      'Basic medical coverage',
      'Emergency care',
      'Prescription assistance',
      'Telehealth services'
    ]
  },
  {
    id: 'member-spouse-3000',
    name: 'Member + Spouse',
    tier: 'Complete',
    price: '$300',
    features: [
      'Comprehensive coverage',
      'Specialist care',
      'Preventive services',
      'Dental & vision'
    ],
    popular: true
  },
  {
    id: 'member-child-3000',
    name: 'Member + Child',
    tier: 'Premium',
    price: '$358',
    features: [
      'All-inclusive coverage',
      'Worldwide care',
      'Alternative medicine',
      'Priority support'
    ]
  },
  {
    id: 'member-family-3000',
    name: 'Member + Family',
    tier: 'Family',
    price: '$545',
    features: [
      'Complete family coverage',
      'Maternity benefits',
      'Pediatric care',
      'Family wellness programs'
    ]
  }
];

const plans6000: Plan[] = [
  {
    id: 'member-only-6000',
    name: 'Member Only',
    tier: 'Essential',
    price: '$180',
    features: [
      'Basic medical coverage',
      'Emergency care',
      'Prescription assistance',
      'Telehealth services'
    ]
  },
  {
    id: 'member-spouse-6000',
    name: 'Member + Spouse',
    tier: 'Complete',
    price: '$178',
    features: [
      'Comprehensive coverage',
      'Specialist care',
      'Preventive services',
      'Dental & vision'
    ],
    popular: true
  },
  {
    id: 'member-child-6000',
    name: 'Member + Child',
    tier: 'Premium',
    price: '$268',
    features: [
      'All-inclusive coverage',
      'Worldwide care',
      'Alternative medicine',
      'Priority support'
    ]
  },
  {
    id: 'member-family-6000',
    name: 'Member + Family',
    tier: 'Family',
    price: '$445',
    features: [
      'Complete family coverage',
      'Maternity benefits',
      'Pediatric care',
      'Family wellness programs'
    ]
  }
];

export const PricingPreview: React.FC<PricingPreviewProps> = ({ 
  showAllLink = true, 
  limit = 4,
  iua = '1500'
}) => {
  const selectedPlans = iua === '3000' ? plans3000 : iua === '6000' ? plans6000 : plans;
  const displayPlans = selectedPlans.slice(0, limit);

  const tierIcons = {
    "Member Only": "👤",
    "Member + Spouse": "🧑‍🤝‍🧑",
    "Member + Child": "👨‍👧",
    "Member + Family": "👨‍👩‍👧‍👦"
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-gray-600">
          Choose the plan that fits your family's needs and budget
        </p>
        <p className="text-sm text-blue-600 mt-2">
          IUA {iua} Plans
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {displayPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className={`relative ${plan.popular ? 'ring-2 ring-blue-700' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tierIcons[plan.name as keyof typeof tierIcons]} {plan.name}
                </h3>
                <div className="text-3xl font-bold text-blue-700">
                  {plan.price}
                  <span className="text-lg text-gray-600 font-normal">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant={plan.popular ? 'primary' : 'outline'}
                asChild
              >
                <Link to="/enrollment">Select Plan</Link>
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {showAllLink && (
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link to="/plans">View All Plans</Link>
          </Button>
        </div>
      )}
    </div>
  );
};