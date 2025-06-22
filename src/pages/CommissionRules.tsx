import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Save,
  X,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface CommissionRule {
  id: string;
  name: string;
  type: 'flat' | 'percent' | 'tiered';
  amount: number | null;
  tiers: Tier[] | null;
  applies_to: 'enrollment' | 'renewal' | 'both';
  active: boolean;
  created_at: string;
}

interface Tier {
  min: number;
  max: number | null;
  rate: number;
}

export const CommissionRules: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    type: 'flat' | 'percent' | 'tiered';
    amount: string;
    applies_to: 'enrollment' | 'renewal' | 'both';
    active: boolean;
    tiers: Tier[];
  }>({
    name: '',
    type: 'percent',
    amount: '',
    applies_to: 'enrollment',
    active: true,
    tiers: [{ min: 1, max: null, rate: 5 }]
  });

  useEffect(() => {
    fetchCommissionRules();
  }, []);

  const fetchCommissionRules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('commission_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setRules(data || []);
    } catch (err: any) {
      console.error('Error fetching commission rules:', err);
      setError(err.message || 'Failed to load commission rules');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleTierChange = (index: number, field: keyof Tier, value: string) => {
    const newTiers = [...formData.tiers];
    
    if (field === 'max' && value === '') {
      newTiers[index] = { ...newTiers[index], [field]: null };
    } else {
      newTiers[index] = { ...newTiers[index], [field]: parseFloat(value) };
    }
    
    setFormData(prev => ({ ...prev, tiers: newTiers }));
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newMin = lastTier.max ? lastTier.max + 1 : lastTier.min + 1;
    
    setFormData(prev => ({
      ...prev,
      tiers: [...prev.tiers, { min: newMin, max: null, rate: lastTier.rate }]
    }));
  };

  const removeTier = (index: number) => {
    if (formData.tiers.length <= 1) return;
    
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'percent',
      amount: '',
      applies_to: 'enrollment',
      active: true,
      tiers: [{ min: 1, max: null, rate: 5 }]
    });
    setEditingRule(null);
  };

  const handleEditRule = (rule: CommissionRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      amount: rule.amount?.toString() || '',
      applies_to: rule.applies_to,
      active: rule.active,
      tiers: rule.tiers || [{ min: 1, max: null, rate: 5 }]
    });
    setShowForm(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commission rule?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error: deleteError } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setRules(prev => prev.filter(rule => rule.id !== id));
      setSuccess('Commission rule deleted successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting commission rule:', err);
      setError(err.message || 'Failed to delete commission rule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error: updateError } = await supabase
        .from('commission_rules')
        .update({ active: !currentActive })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setRules(prev => prev.map(rule => 
        rule.id === id ? { ...rule, active: !currentActive } : rule
      ));
      
      setSuccess(`Commission rule ${!currentActive ? 'activated' : 'deactivated'} successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating commission rule:', err);
      setError(err.message || 'Failed to update commission rule');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }

      if (formData.type !== 'tiered' && (!formData.amount || isNaN(parseFloat(formData.amount)))) {
        throw new Error('Amount is required for flat and percentage commission types');
      }

      if (formData.type === 'tiered' && (!formData.tiers || formData.tiers.length === 0)) {
        throw new Error('At least one tier is required for tiered commission type');
      }

      // Prepare data for submission
      const submissionData = {
        name: formData.name,
        type: formData.type,
        amount: formData.type !== 'tiered' ? parseFloat(formData.amount) : null,
        tiers: formData.type === 'tiered' ? formData.tiers : null,
        applies_to: formData.applies_to,
        active: formData.active
      };

      let result;

      if (editingRule) {
        // Update existing rule
        const { data, error: updateError } = await supabase
          .from('commission_rules')
          .update(submissionData)
          .eq('id', editingRule.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        result = data;
        setRules(prev => prev.map(rule => 
          rule.id === editingRule.id ? result : rule
        ));
        setSuccess('Commission rule updated successfully');
      } else {
        // Create new rule
        const { data, error: insertError } = await supabase
          .from('commission_rules')
          .insert(submissionData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        result = data;
        setRules(prev => [result, ...prev]);
        setSuccess('Commission rule created successfully');
      }

      // Reset form and close it
      resetForm();
      setShowForm(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving commission rule:', err);
      setError(err.message || 'Failed to save commission rule');
    } finally {
      setLoading(false);
    }
  };

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to manage commission rules.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Commission Rules</h1>
              <p className="text-gray-600">Manage how affiliate agents earn commissions</p>
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              disabled={showForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Rule
            </Button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card className="p-6 border-blue-200 bg-blue-50">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-blue-900">
                    {editingRule ? 'Edit Commission Rule' : 'Add New Commission Rule'}
                  </h2>
                  <button 
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rule Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Standard Commission, Tiered Payout"
                      required
                    />
                  </div>

                  {/* Rule Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="flat">Flat Amount</option>
                      <option value="percent">Percentage</option>
                      <option value="tiered">Tiered</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.type === 'flat' && 'Fixed dollar amount per enrollment/renewal'}
                      {formData.type === 'percent' && 'Percentage of the plan price'}
                      {formData.type === 'tiered' && 'Different rates based on number of referrals'}
                    </p>
                  </div>

                  {/* Amount (for flat and percent types) */}
                  {formData.type !== 'tiered' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.type === 'flat' ? 'Amount ($) *' : 'Percentage (%) *'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {formData.type === 'flat' ? (
                            <DollarSign className="w-4 h-4 text-gray-400" />
                          ) : (
                            <span className="text-gray-400">%</span>
                          )}
                        </div>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={formData.type === 'flat' ? '50.00' : '10.00'}
                          step="0.01"
                          min="0"
                          max={formData.type === 'percent' ? "100" : undefined}
                          required={formData.type !== 'tiered'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tiers (for tiered type) */}
                  {formData.type === 'tiered' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Commission Tiers *
                        </label>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline"
                          onClick={addTier}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Tier
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {formData.tiers.map((tier, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Min</label>
                              <input
                                type="number"
                                value={tier.min}
                                onChange={(e) => handleTierChange(index, 'min', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Max</label>
                              <input
                                type="number"
                                value={tier.max === null ? '' : tier.max}
                                onChange={(e) => handleTierChange(index, 'max', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min={tier.min + 1}
                                placeholder="∞"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Rate (%)</label>
                              <input
                                type="number"
                                value={tier.rate}
                                onChange={(e) => handleTierChange(index, 'rate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="0"
                                max="100"
                                step="0.1"
                                required
                              />
                            </div>
                            <div className="pt-6">
                              <button
                                type="button"
                                onClick={() => removeTier(index)}
                                disabled={formData.tiers.length <= 1}
                                className="p-2 text-red-600 hover:text-red-800 disabled:text-gray-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Leave the Max field empty for the highest tier to indicate no upper limit
                      </p>
                    </div>
                  )}

                  {/* Applies To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Applies To *
                    </label>
                    <select
                      name="applies_to"
                      value={formData.applies_to}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="enrollment">Enrollment Only</option>
                      <option value="renewal">Renewal Only</option>
                      <option value="both">Both Enrollment & Renewal</option>
                    </select>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      name="active"
                      checked={formData.active}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingRule ? 'Update Rule' : 'Save Rule'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Rules Table */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Rules</h2>
              
              {loading && rules.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Commission Rules</h3>
                  <p className="text-gray-600 mb-4">Create your first commission rule to define how agents earn.</p>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Commission Rule
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applies To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                              {rule.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {rule.type === 'flat' && (
                              <div className="text-sm text-gray-900">${rule.amount?.toFixed(2)}</div>
                            )}
                            {rule.type === 'percent' && (
                              <div className="text-sm text-gray-900">{rule.amount?.toFixed(2)}%</div>
                            )}
                            {rule.type === 'tiered' && (
                              <div className="text-sm text-gray-900">
                                {rule.tiers?.length || 0} tiers
                                <button
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                  onClick={() => alert(JSON.stringify(rule.tiers, null, 2))}
                                >
                                  <Info className="w-3 h-3 inline" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">
                              {rule.applies_to.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              rule.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(rule.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditRule(rule)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleToggleActive(rule.id, rule.active)}
                              >
                                {rule.active ? (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Commission Rules Guide */}
          <Card className="p-6 bg-blue-50 border-blue-200 mt-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Commission Rules Guide</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Flat Amount</h4>
                <p className="text-blue-700 text-sm mb-2">
                  A fixed dollar amount paid for each enrollment or renewal.
                </p>
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-700">Example: <span className="font-semibold">$50 per enrollment</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    Agent receives $50 for each new member they enroll, regardless of plan price.
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Percentage</h4>
                <p className="text-blue-700 text-sm mb-2">
                  A percentage of the plan price paid as commission.
                </p>
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-700">Example: <span className="font-semibold">10% of plan price</span></p>
                  <p className="text-xs text-gray-500 mt-1">
                    For a $500 plan, agent receives $50 (10% of $500).
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Tiered</h4>
                <p className="text-blue-700 text-sm mb-2">
                  Different rates based on number of referrals.
                </p>
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-700">Example: <span className="font-semibold">Increasing rates</span></p>
                  <ul className="text-xs text-gray-500 mt-1 space-y-1">
                    <li>• 1-5 referrals: 5% commission</li>
                    <li>• 6-10 referrals: 7.5% commission</li>
                    <li>• 11+ referrals: 10% commission</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};