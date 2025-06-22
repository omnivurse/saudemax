import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, CreditCard, Users, MapPin, User, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EnrollmentData } from './EnrollmentForm';
import { useAffiliate, getStoredAffiliateCode } from '../../hooks/useAffiliate';

interface Step5Props {
  formData: EnrollmentData;
  prevStep: () => void;
}

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate Accept.js tokenization
      const opaqueData = await new Promise<any>((resolve, reject) => {
        // In real implementation, this would use Accept.js
        setTimeout(() => {
          if (paymentData.cardNumber && paymentData.expMonth && paymentData.expYear && paymentData.cvv) {
            resolve({
              dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
              dataValue: 'eyJjb2RlIjoiNTBfMl8wNjAwMDUyN...' // Mock token
            });
          } else {
            reject('Dados do cartão incompletos');
          }
        }, 1000);
      });

      // Submit to backend
      const response = await fetch('/api/process-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opaqueData,
          customerInfo: {
            email: formData.primary.email,
            firstName: formData.primary.firstName,
            lastName: formData.primary.lastName
          },
          planInfo: {
            planId: formData.plan.planId,
            planName: formData.plan.planName,
            monthlyAmount: formData.plan.monthlyAmount
          },
          enrollmentData: formData
        })
      });

      const result = await response.json();
      
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
      } else {
        setStatus({ success: false, message: result.message || 'Falha ao processar pagamento' });
      }
    } catch (error) {
      setStatus({ success: false, message: 'Erro de rede. Verifique sua conexão.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bem-vindo ao SaudeMAX!
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Sua inscrição está completa. Agora você é membro da comunidade SaudeMAX.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-blue-900 mb-4">O que acontece agora?</h3>
            <ul className="text-blue-800 text-sm space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                Email de confirmação enviado para {formData.primary.email}
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                Cartão de membro chegará em 7-10 dias úteis
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                Seu consultor entrará em contato em 24 horas
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                Acesso à telemedicina começa imediatamente
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/member/dashboard'}
              size="lg"
              className="w-full max-w-sm"
            >
              Acessar Portal do Membro
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              size="lg"
              className="w-full max-w-sm"
            >
              Voltar ao Início
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Sua Inscrição</h2>
        <p className="text-gray-600">Revise suas informações e complete o pagamento para se juntar ao SaudeMAX</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Enrollment Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Plan Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Plano</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{formData.plan.planName}</h4>
                <p className="text-2xl font-bold text-blue-700">
                  ${formData.plan.monthlyAmount}
                  <span className="text-sm text-gray-600 font-normal">/mês</span>
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total Mensal:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${formData.plan.monthlyAmount}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cobrado mensalmente • Cancele a qualquer momento
                </p>
              </div>
            </div>
          </Card>

          {/* Member Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Membro</h3>
            <div className="space-y-4">
              {/* Primary Member */}
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formData.primary.firstName} {formData.primary.lastName}
                  </p>
                  <p className="text-sm text-gray-600">Membro Principal</p>
                  <p className="text-sm text-gray-600">{formData.primary.email}</p>
                </div>
              </div>

              {/* Dependents */}
              {formData.dependents.length > 0 && (
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {formData.dependents.length} Familiar{formData.dependents.length > 1 ? 'es' : ''}
                    </p>
                    <div className="text-sm text-gray-600">
                      {formData.dependents.map((dep, index) => (
                        <p key={dep.id}>
                          {dep.firstName} {dep.lastName} ({dep.relationship})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Endereço de Serviço</p>
                  <div className="text-sm text-gray-600">
                    <p>{formData.address.street}</p>
                    <p>{formData.address.city}, {formData.address.state} {formData.address.zipCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Edit Button */}
          <Button variant="outline" onClick={prevStep} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Editar Informações
          </Button>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Informações de Pagamento</h3>
            
            {/* Security Notice */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Pagamento Seguro</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Suas informações de pagamento são criptografadas e processadas com segurança
              </p>
            </div>

            {/* Status Messages */}
            {status && (
              <div className={`mb-6 p-4 rounded-lg border ${
                status.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {status.message}
              </div>
            )}

            <div className="space-y-6">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Cartão *
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês *
                  </label>
                  <input
                    type="text"
                    name="expMonth"
                    value={paymentData.expMonth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="MM"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano *
                  </label>
                  <input
                    type="text"
                    name="expYear"
                    value={paymentData.expYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="AA"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              {/* ZIP Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  name="zip"
                  value={paymentData.zip}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12345"
                />
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
                    Concordo com os Termos de Serviço e autorizo o SaudeMAX a cobrar ${formData.plan.monthlyAmount} 
                    mensalmente do meu método de pagamento.
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                loading={isProcessing}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                <Lock className="w-5 h-5 mr-2" />
                {isProcessing ? 'Processando...' : `Assinar por $${formData.plan.monthlyAmount}/mês`}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};