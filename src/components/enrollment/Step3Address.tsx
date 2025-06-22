import React, { useState } from 'react';
import { MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { EnrollmentData } from './EnrollmentForm';

interface Step3Props {
  formData: EnrollmentData;
  updateData: <K extends keyof EnrollmentData>(section: K, data: Partial<EnrollmentData[K]>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const Step3Address: React.FC<Step3Props> = ({ formData, updateData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState(formData.address || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!localData.street?.trim()) newErrors.street = 'Street address is required';
    if (!localData.city?.trim()) newErrors.city = 'City is required';
    if (!localData.state?.trim()) newErrors.state = 'State is required';
    if (!localData.zip?.trim()) newErrors.zip = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      updateData('address', localData);
      nextStep();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-blue-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Address Information</h2>
        <p className="text-gray-600">Where do you reside in the U.S.?</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
          <input
            type="text"
            name="street"
            value={localData.street || ''}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg ${
              errors.street ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="123 Main St"
          />
          {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              name="city"
              value={localData.city || ''}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Orlando"
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
            <input
              type="text"
              name="state"
              value={localData.state || ''}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="FL"
              maxLength={2}
            />
            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
            <input
              type="text"
              name="zip"
              value={localData.zip || ''}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.zip ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="32801"
              maxLength={10}
            />
            {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
          </div>
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
