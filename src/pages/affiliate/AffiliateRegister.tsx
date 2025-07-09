import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, DollarSign, Users, TrendingUp, Mail, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../components/auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkCreateAffiliateUserFunction, diagnoseCreateAffiliateUserFunction } from '../../lib/checkEdgeFunctionStatus';

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  payoutEmail: z.string().email({ message: "Please enter a valid payout email address" }),
  payoutMethod: z.enum(['paypal', 'bank_transfer', 'crypto'])
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof formSchema>;

export const AffiliateRegister: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [functionStatus, setFunctionStatus] = useState<any | null>(null);
  const [isCheckingFunction, setIsCheckingFunction] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      payoutEmail: '',
      payoutMethod: 'paypal'
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Submitting to Edge Function...");
      console.log("Supabase URL:", supabase.supabaseUrl);
      
      // Generate a unique request ID for debugging
      const requestId = Math.random().toString(36).substring(2, 15);
      console.log("Request ID:", requestId);
      
      // First, check if the function is accessible
      const status = await checkCreateAffiliateUserFunction();
      setFunctionStatus(status);
      
      if (!status.accessible) {
        throw new Error(`Function is not accessible: ${status.message}`);
      }
      
      // Call the Edge Function to create the affiliate user
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-affiliate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'X-Request-ID': requestId
          // Removed Cache-Control header
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          payoutEmail: data.payoutEmail,
          payoutMethod: data.payoutMethod
        })
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to create affiliate account");
      }

      const result = await response.json();
      console.log("Success response:", result);

      setSuccess("Account created successfully! Please check your email to confirm your account.");
      
      // Sign in the user automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        console.warn("Auto sign-in failed:", signInError);
        // Continue anyway, user can sign in manually
      }

      // Redirect after a delay
      setTimeout(() => {
        navigate('/affiliate');
      }, 2000);
    } catch (err: any) {
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause
      });
      
      setError(err.message || "Failed to create account. Please try again.");
      
      // If we get a network error, run diagnostics
      if (err.message.includes('Failed to fetch')) {
        setShowDiagnostics(true);
        try {
          const diagnosis = await diagnoseCreateAffiliateUserFunction();
          setFunctionStatus(diagnosis);
        } catch (diagErr) {
          console.error("Error running diagnostics:", diagErr);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: 'High Commissions',
      description: 'Earn up to 15% commission on every successful referral'
    },
    {
      icon: Users,
      title: 'Growing Market',
      description: 'Healthcare sharing is rapidly expanding with huge potential'
    },
    {
      icon: TrendingUp,
      title: 'Recurring Revenue',
      description: 'Monthly subscriptions mean ongoing passive income'
    }
  ];

  // If user is already logged in, redirect to affiliate dashboard
  if (user) {
    navigate('/affiliate');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Join Our Affiliate Program
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Partner with SaudeMAX and earn commissions by referring new members to our healthcare sharing community
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Become an Affiliate?</h2>
            
            <div className="space-y-6 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Program Highlights</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• Commission rates from 10% to 15%</li>
                <li>• Monthly payouts via PayPal or bank transfer</li>
                <li>• Real-time tracking and analytics</li>
                <li>• Marketing materials and support</li>
                <li>• No minimum payout threshold</li>
                <li>• Dedicated affiliate manager</li>
              </ul>
            </Card>
          </motion.div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Affiliate Registration</h3>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                  {error.includes('Failed to fetch') && (
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={async () => {
                          setShowDiagnostics(true);
                          setIsCheckingFunction(true);
                          try {
                            const diagnosis = await diagnoseCreateAffiliateUserFunction();
                            setFunctionStatus(diagnosis);
                          } catch (diagErr) {
                            console.error("Error running diagnostics:", diagErr);
                          } finally {
                            setIsCheckingFunction(false);
                          }
                        }}
                        loading={isCheckingFunction}
                      >
                        Run Diagnostics
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">{success}</p>
                </div>
              )}

              {showDiagnostics && functionStatus && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Function Diagnostics</h4>
                  <p className="text-yellow-800 text-sm mb-2">{functionStatus.message}</p>
                  
                  {functionStatus.diagnosis && (
                    <p className="text-yellow-800 text-sm mb-2"><strong>Diagnosis:</strong> {functionStatus.diagnosis}</p>
                  )}
                  
                  {functionStatus.possibleIssues && (
                    <div className="mb-2">
                      <p className="text-yellow-800 text-sm font-medium">Possible Issues:</p>
                      <ul className="list-disc pl-5 text-yellow-800 text-sm">
                        {functionStatus.possibleIssues.map((issue: string, i: number) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {functionStatus.recommendations && (
                    <div>
                      <p className="text-yellow-800 text-sm font-medium">Recommendations:</p>
                      <ul className="list-disc pl-5 text-yellow-800 text-sm">
                        {functionStatus.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register("fullName")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used for affiliate communications and login
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    {...register("confirmPassword")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Payout Method *
                  </label>
                  <select
                    {...register("payoutMethod")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Email/Address *
                  </label>
                  <input
                    type="text"
                    {...register("payoutEmail")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="payout@email.com"
                  />
                  {errors.payoutEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.payoutEmail.message}</p>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Application Review</h4>
                  <p className="text-yellow-800 text-sm">
                    Your affiliate application will be reviewed within 24-48 hours. 
                    You'll receive an email notification once approved.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the <Link to="/affiliate/terms" className="text-blue-600 hover:text-blue-800">Affiliate Terms and Conditions</Link> and 
                    confirm that all information provided is accurate.
                  </label>
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Submitting Application..." : "Submit Application"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Already an affiliate? <Link to="/affiliate-login" className="text-blue-600 hover:text-blue-800 font-medium">Login here</Link>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateRegister;