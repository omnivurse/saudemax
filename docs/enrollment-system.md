# SaudeMAX Enrollment System Documentation

## Overview

The SaudeMAX Enrollment System is a multi-step wizard that guides users through the process of selecting a healthcare sharing plan, providing personal information, and completing payment to become a SaudeMAX member. The system is designed to be user-friendly, secure, and efficient.

## Enrollment Flow

The enrollment process consists of five main steps:

1. **Plan Selection**: Users choose from available healthcare sharing plans
2. **Personal Information**: Users provide primary member details
3. **Address Information**: Users provide contact and location information
4. **Dependents** (for family plans): Users add family members to be covered
5. **Payment**: Users complete payment to finalize enrollment

## Database Schema

The enrollment data is stored across several tables:

```sql
-- Member Profiles (created upon successful enrollment)
CREATE TABLE member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  member_number text UNIQUE NOT NULL,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  plan_type text CHECK (plan_type IN ('individual', 'family')) NOT NULL,
  status text CHECK (status IN ('active', 'pending', 'suspended', 'cancelled')) DEFAULT 'pending',
  enrollment_date date NOT NULL,
  next_billing_date date NOT NULL,
  monthly_contribution numeric(10,2) NOT NULL,
  advisor_id uuid,
  emergency_contact jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Member Dependents (for family plans)
CREATE TABLE member_dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid REFERENCES member_profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  relationship text NOT NULL,
  status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Component Structure

### EnrollmentForm

The main container component that manages the enrollment state and steps.

```tsx
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

  // Render the current step
  // ...
};
```

### Step Components

#### Step1Plan

Allows users to select a healthcare sharing plan.

```tsx
export const Step1Plan: React.FC<Step1Props> = ({ formData, updateData, nextStep }) => {
  const [selectedPlanId, setSelectedPlanId] = useState(formData.plan.planId);
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>(formData.plan.frequency);
  const [planType, setPlanType] = useState<'individual' | 'family'>('individual');

  // Plan selection logic
  // ...
};
```

#### Step2Primary

Collects primary member information.

```tsx
export const Step2Primary: React.FC<Step2Props> = ({ formData, updateData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState(formData.primary);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation and submission logic
  // ...
};
```

#### Step3Address

Collects address and contact information.

```tsx
export const Step3Address: React.FC<Step3Props> = ({ formData, updateData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState(formData.address || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address validation and submission logic
  // ...
};
```

#### Step4Dependents

Allows adding family members for family plans.

```tsx
export const Step4Dependents: React.FC<Step4Props> = ({ formData, updateData, nextStep, prevStep }) => {
  const [dependents, setDependents] = useState<Dependent[]>(formData.dependents);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDependent, setNewDependent] = useState<Omit<Dependent, 'id'>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    relationship: '',
    gender: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFamily = formData.plan.planType === 'family';

  // Dependent management logic
  // ...
};
```

#### Step5Payment

Handles payment processing and enrollment completion.

```tsx
export const Step5Payment: React.FC<Step5Props> = ({ formData, prevStep }) => {
  const { trackReferral } = useAffiliate();
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: '',
    zip: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Payment processing logic
  // ...
};
```

## Payment Integration

The enrollment system integrates with Authorize.Net for secure payment processing:

```tsx
export const AuthorizePaymentForm: React.FC<PaymentFormProps> = ({
  planId,
  planName,
  monthlyAmount,
  onSuccess,
  onError
}) => {
  // Payment form state and handlers
  // ...

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
        // Handle tokenized card data and create subscription
        // ...
      });
    } catch (error) {
      // Error handling
      // ...
    }
  };

  // Render payment form
  // ...
};
```

## Backend Processing

The enrollment system includes a Node.js backend for secure payment processing:

```javascript
router.post('/api/process-subscription', async (req, res) => {
  try {
    const { opaqueData, customerInfo, planInfo } = req.body;

    // Validate required fields
    if (!opaqueData || !customerInfo || !planInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Set up merchant authentication
    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(apiLoginKey);
    merchantAuthenticationType.setTransactionKey(transactionKey);

    // Set up payment data from tokenized card
    const paymentType = new APIContracts.PaymentType();
    const opaqueDataType = new APIContracts.OpaqueDataType();
    opaqueDataType.setDataDescriptor(opaqueData.dataDescriptor);
    opaqueDataType.setDataValue(opaqueData.dataValue);
    paymentType.setOpaqueData(opaqueDataType);

    // Create customer profile
    // ...

    // Create subscription
    // ...

    // Process response
    // ...
  } catch (error) {
    console.error('Subscription processing error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error occurred while processing subscription",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

## Affiliate Integration

The enrollment system integrates with the affiliate system to track referrals:

```tsx
// In Step5Payment.tsx
const handleSubmit = async () => {
  // ... payment processing logic

  if (result.success) {
    setStatus({ success: true, message: 'Assinatura criada com sucesso!' });
    setPaymentComplete(true);

    // Track affiliate referral if there's a stored affiliate code
    const affiliateCode = getStoredAffiliateCode();
    if (affiliateCode) {
      try {
        await trackReferral(affiliateCode, {
          order_id: result.subscriptionId,
          order_amount: formData.plan.monthlyAmount,
          conversion_type: 'subscription'
        });
      } catch (err) {
        console.error('Failed to track affiliate referral:', err);
      }
    }
  }
};
```

## User Experience Enhancements

### Progress Indicator

```tsx
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
```

### Animations

The enrollment system uses Framer Motion for smooth transitions between steps:

```tsx
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
```

### Form Validation

Comprehensive form validation is implemented for each step:

```tsx
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!localData.firstName.trim()) newErrors.firstName = 'First name is required';
  if (!localData.lastName.trim()) newErrors.lastName = 'Last name is required';

  if (!localData.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(localData.email)) {
    newErrors.email = 'Please enter a valid email address';
  }

  // Additional validation rules
  // ...

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Security Considerations

1. **Data Protection**:
   - Sensitive data (SSN, payment info) is never stored directly
   - Payment processing uses tokenization via Authorize.Net
   - All form submissions use HTTPS

2. **Form Security**:
   - CSRF protection
   - Input validation and sanitization
   - Rate limiting on submission endpoints

3. **Session Management**:
   - Secure session handling
   - Automatic timeout for incomplete enrollments
   - Progress saving for multi-session completion

## Internationalization

The enrollment system supports multiple languages using i18next:

```tsx
// i18n configuration
const resources = {
  en: {
    translation: {
      // English translations
      'enrollment.title': 'Join SaudeMAX',
      'enrollment.steps.personal': 'Personal Information',
      // ...
    }
  },
  pt: {
    translation: {
      // Portuguese translations
      'enrollment.title': 'Junte-se ao SaudeMAX',
      'enrollment.steps.personal': 'Informações Pessoais',
      // ...
    }
  }
};
```

## Mobile Responsiveness

The enrollment system is fully responsive and optimized for mobile devices:

- Responsive layout using Tailwind CSS
- Mobile-friendly form inputs
- Touch-optimized UI components
- Simplified navigation on small screens
- Optimized loading states

## Analytics Integration

The enrollment system includes tracking for analytics:

```tsx
// Track enrollment step completion
const trackStepCompletion = (step: number) => {
  // Analytics tracking code
  // ...
};

// Track enrollment completion
const trackEnrollmentCompletion = (planId: string, amount: number) => {
  // Analytics tracking code
  // ...
};
```

## Error Handling

Comprehensive error handling is implemented throughout the enrollment process:

```tsx
try {
  // API call or processing logic
  // ...
} catch (error) {
  // Log error
  console.error('Error during enrollment:', error);
  
  // Show user-friendly error message
  setStatus({
    success: false,
    message: 'An error occurred. Please try again or contact support.'
  });
  
  // Report error to monitoring system
  // ...
}
```

## Testing Considerations

The enrollment system should be tested for:

1. **Form Validation**: Ensure all validation rules work correctly
2. **Payment Processing**: Test successful and failed payment scenarios
3. **User Experience**: Test the flow on different devices and browsers
4. **Performance**: Ensure the system handles load efficiently
5. **Security**: Test for common vulnerabilities (XSS, CSRF, etc.)
6. **Accessibility**: Ensure the system is accessible to all users