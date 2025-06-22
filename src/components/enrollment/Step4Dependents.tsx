import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EnrollmentData } from './EnrollmentForm';

interface Step4Props {
  formData: EnrollmentData;
  updateData: <K extends keyof EnrollmentData>(section: K, data: Partial<EnrollmentData[K]>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface Dependent {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
  gender: string;
}

const RELATIONSHIPS = [
  'Cônjuge',
  'Filho(a)',
  'Enteado(a)',
  'Filho(a) Adotivo(a)',
  'Filho(a) de Criação',
  'Outro'
];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDependent(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateDependent = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newDependent.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }

    if (!newDependent.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
    }

    if (!newDependent.dateOfBirth) {
      newErrors.dateOfBirth = 'Data de nascimento é obrigatória';
    } else {
      const birthDate = new Date(newDependent.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (newDependent.relationship === 'Filho(a)' && age >= 26) {
        newErrors.dateOfBirth = 'Filhos devem ter menos de 26 anos';
      }
    }

    if (!newDependent.relationship) {
      newErrors.relationship = 'Parentesco é obrigatório';
    }

    if (!newDependent.gender) {
      newErrors.gender = 'Gênero é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addDependent = () => {
    if (validateDependent()) {
      const dependent: Dependent = {
        ...newDependent,
        id: Date.now().toString()
      };
      
      if (editingId) {
        setDependents(prev => prev.map(d => d.id === editingId ? dependent : d));
        setEditingId(null);
      } else {
        setDependents(prev => [...prev, dependent]);
      }
      
      setNewDependent({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        relationship: '',
        gender: ''
      });
      setShowAddForm(false);
      setErrors({});
    }
  };

  const editDependent = (dependent: Dependent) => {
    setNewDependent({
      firstName: dependent.firstName,
      lastName: dependent.lastName,
      dateOfBirth: dependent.dateOfBirth,
      relationship: dependent.relationship,
      gender: dependent.gender
    });
    setEditingId(dependent.id);
    setShowAddForm(true);
  };

  const removeDependent = (id: string) => {
    setDependents(prev => prev.filter(d => d.id !== id));
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewDependent({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      relationship: '',
      gender: ''
    });
    setErrors({});
  };

  const handleNext = () => {
    updateData('dependents', dependents);
    nextStep();
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-purple-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dependentes</h2>
        {isFamily ? (
          <p className="text-gray-600">Adicione familiares para serem cobertos pelo seu plano</p>
        ) : (
          <p className="text-gray-600">Planos individuais cobrem apenas o membro principal</p>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        {!isFamily ? (
          <Card className="text-center">
            <div className="py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Plano Individual Selecionado</h3>
              <p className="text-gray-600 mb-4">
                Seu plano Individual cobre apenas você como membro principal.
              </p>
              <p className="text-sm text-blue-600">
                Quer adicionar familiares? Você pode fazer upgrade para um plano Família a qualquer momento.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Current Dependents */}
            {dependents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Familiares ({dependents.length})
                </h3>
                <div className="space-y-3">
                  {dependents.map((dependent, index) => (
                    <motion.div
                      key={dependent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {dependent.firstName} {dependent.lastName}
                            </h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>{dependent.relationship} • {dependent.gender}</p>
                              <p>Idade: {calculateAge(dependent.dateOfBirth)} anos</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => editDependent(dependent)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeDependent(dependent.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Dependent Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {editingId ? 'Editar Familiar' : 'Adicionar Familiar'}
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={newDependent.firstName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.firstName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nome"
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sobrenome *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={newDependent.lastName}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.lastName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Sobrenome"
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Nascimento *
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={newDependent.dateOfBirth}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.dateOfBirth && (
                            <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parentesco *
                          </label>
                          <select
                            name="relationship"
                            value={newDependent.relationship}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.relationship ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Selecionar</option>
                            {RELATIONSHIPS.map(rel => (
                              <option key={rel} value={rel}>{rel}</option>
                            ))}
                          </select>
                          {errors.relationship && (
                            <p className="mt-1 text-sm text-red-600">{errors.relationship}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gênero *
                          </label>
                          <select
                            name="gender"
                            value={newDependent.gender}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.gender ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Selecionar</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Outro">Outro</option>
                          </select>
                          {errors.gender && (
                            <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={cancelAdd}>
                          Cancelar
                        </Button>
                        <Button onClick={addDependent}>
                          {editingId ? 'Atualizar' : 'Adicionar'} Familiar
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Button */}
            {!showAddForm && dependents.length < 5 && (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full border-dashed border-2 py-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Dependente
              </Button>
            )}

            {/* Coverage Limits Notice */}
            {dependents.length >= 5 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Limite de Cobertura:</strong> Planos familiares cobrem até 6 membros totais 
                  (membro principal + 5 dependentes). Entre em contato se precisar de cobertura para familiares adicionais.
                </p>
              </div>
            )}

            {/* Coverage Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Informações de Cobertura</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Filhos são cobertos até os 26 anos</li>
                <li>• Cônjuges têm benefícios completos de cobertura</li>
                <li>• Todos os familiares compartilham a mesma franquia</li>
                <li>• Sem custo adicional para crianças menores de 18 anos</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleNext}>
          Continuar para Pagamento
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};