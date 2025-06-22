import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { EnrollmentData } from './EnrollmentForm';

interface Step2Props {
  formData: EnrollmentData;
  updateData: <K extends keyof EnrollmentData>(section: K, data: Partial<EnrollmentData[K]>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const Step2Primary: React.FC<Step2Props> = ({ formData, updateData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState(formData.primary);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!localData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!localData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!localData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(localData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!localData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(localData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!localData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(localData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'Primary member must be at least 18 years old';
      }
    }

    if (!localData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!localData.ssn.trim()) {
      newErrors.ssn = 'SSN is required';
    } else if (!/^\d{3}-?\d{2}-?\d{4}$/.test(localData.ssn)) {
      newErrors.ssn = 'Please enter a valid SSN (XXX-XX-XXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      updateData('primary', localData);
      nextStep();
    }
  };

  const formatSSN = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Information</h2>
        <p className="text-gray-600">Tell us about the primary member on this plan</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={localData.firstName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={localData.lastName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Doe"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              name="email"
              value={localData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john.doe@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={localData.phone}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                handleInputChange({ target: { name: 'phone', value: formatted } } as any);
              }}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={localData.dateOfBirth}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
              max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
            <select
              name="gender"
              value={localData.gender}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Security Number *</label>
            <input
              type="text"
              name="ssn"
              value={localData.ssn}
              onChange={(e) => {
                const formatted = formatSSN(e.target.value);
                handleInputChange({ target: { name: 'ssn', value: formatted } } as any);
              }}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.ssn ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="XXX-XX-XXXX"
              maxLength={11}
            />
            {errors.ssn && <p className="mt-1 text-sm text-red-600">{errors.ssn}</p>}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Privacy Notice:</strong> Your personal information is encrypted and secure. 
            We use this information only for enrollment and member services.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
