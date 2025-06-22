import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Globe, 
  Shield, 
  Phone, 
  Stethoscope,
  DollarSign,
  Baby,
  Pill,
  Activity,
  CheckCircle,
  Star
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const AboutPage: React.FC = () => {
  const services = [
    {
      icon: Stethoscope,
      title: 'Telemedicina com médicos que falam português',
      description: 'Consultas médicas online com profissionais brasileiros qualificados'
    },
    {
      icon: Users,
      title: 'Plano de saúde voltado para imigrantes brasileiros',
      description: 'Cobertura especializada para a comunidade brasileira nos EUA'
    },
    {
      icon: DollarSign,
      title: 'Descontos em exames e medicamentos',
      description: 'Economia significativa em serviços médicos essenciais'
    },
    {
      icon: Activity,
      title: 'Cobertura para emergências',
      description: 'Proteção completa para situações de emergência médica'
    },
    {
      icon: Baby,
      title: 'Cobertura para gravidez',
      description: 'Suporte completo durante toda a jornada da maternidade'
    },
    {
      icon: Pill,
      title: 'Tratamentos e cirurgias pré-aprovadas',
      description: 'Acesso a procedimentos médicos necessários com aprovação prévia'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Brasileiros Atendidos' },
    { value: '98%', label: 'Satisfação dos Membros' },
    { value: '24/7', label: 'Suporte Disponível' },
    { value: '50+', label: 'Estados Cobertos' }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      location: 'Miami, FL',
      text: 'O SaudeMax mudou minha vida nos EUA. Finalmente tenho acesso a cuidados de saúde de qualidade com médicos que falam português.',
      rating: 5
    },
    {
      name: 'João Santos',
      location: 'Orlando, FL',
      text: 'Excelente atendimento e preços justos. A telemedicina é muito conveniente para nossa família.',
      rating: 5
    },
    {
      name: 'Ana Costa',
      location: 'Tampa, FL',
      text: 'Recomendo para todos os brasileiros. O suporte é excepcional e os médicos são muito atenciosos.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 py-20">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Conheça a SaudeMax
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Com o SaúdeMax, nossa missão é garantir acesso a cuidados de saúde que abrangem prevenção e tratamento para brasileiros nos EUA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                <Phone className="w-5 h-5 mr-2" />
                Fale Conosco
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                Saiba Mais
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-blue-700 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Nossa Missão
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Garantir acesso a cuidados de saúde que abrangem prevenção e tratamento para brasileiros nos EUA, 
              oferecendo soluções personalizadas e atendimento em português.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: 'Cuidado Personalizado',
                description: 'Atendimento focado nas necessidades específicas da comunidade brasileira'
              },
              {
                icon: Globe,
                title: 'Acesso Global',
                description: 'Cobertura abrangente em todos os estados americanos'
              },
              {
                icon: Shield,
                title: 'Proteção Completa',
                description: 'Segurança e tranquilidade para você e sua família'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-blue-700" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              O que oferecemos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Serviços completos de saúde pensados especialmente para brasileiros vivendo nos Estados Unidos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <service.icon className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-gray-600 text-sm">{service.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              O que nossos membros dizem
            </h2>
            <p className="text-xl text-gray-600">
              Depoimentos reais de brasileiros que confiam no SaudeMax
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.location}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Callout Section */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
          >
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Health coverage, affordability and peace of mind
            </h3>
            <p className="text-xl text-blue-100 mb-8 italic">
              — tudo em português!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                <CheckCircle className="w-5 h-5 mr-2" />
                Comece Hoje
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                <Phone className="w-5 h-5 mr-2" />
                Fale Conosco
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Por que escolher o SaudeMax?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                {[
                  'Atendimento 100% em português',
                  'Médicos brasileiros qualificados',
                  'Preços acessíveis e transparentes',
                  'Cobertura em todos os estados americanos',
                  'Suporte 24/7 para emergências',
                  'Processo de aprovação rápido'
                ].map((benefit, index) => (
                  <div key={benefit} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Pronto para começar?
                </h3>
                <p className="text-gray-700 mb-6">
                  Junte-se a milhares de brasileiros que já confiam no SaudeMax para seus cuidados de saúde nos EUA.
                </p>
                <div className="space-y-4">
                  <Button className="w-full" size="lg">
                    Solicitar Cotação Gratuita
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <Phone className="w-4 h-4 mr-2" />
                    (561) 466‑9558
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};