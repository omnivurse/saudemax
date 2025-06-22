import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Heart, Star, ArrowRight, Check, Ambulance, Stethoscope, DollarSign, Scissors, UserCheck, Play, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AffiliateLeaderboardWidget } from '../components/affiliate/AffiliateLeaderboardWidget';
import { PricingPreview } from '../components/PricingPreview';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Shield,
      title: t('home.features.affordability.title'),
      description: t('home.features.affordability.description'),
      color: 'text-blue-700'
    },
    {
      icon: Users,
      title: t('home.features.community.title'),
      description: t('home.features.community.description'),
      color: 'text-green-600'
    },
    {
      icon: Heart,
      title: t('home.features.support.title'),
      description: t('home.features.support.description'),
      color: 'text-orange-600'
    }
  ];

  const stats = [
    { value: '50,000+', label: 'Active Members' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '$2.5B+', label: 'Medical Bills Shared' },
    { value: '24/7', label: 'Support Available' }
  ];

  const healthPlanFeatures = [
    {
      icon: Ambulance,
      title: 'Hospital Coverage',
      description: 'Say goodbye to expensive and restrictive options.',
      color: 'text-green-600'
    },
    {
      icon: Stethoscope,
      title: 'Telemedicine',
      description: 'Fast online consultations.',
      color: 'text-green-600'
    },
    {
      icon: DollarSign,
      title: 'Exam Discounts',
      description: 'Discounts on exams and laboratories.',
      color: 'text-green-600'
    },
    {
      icon: Scissors,
      title: 'Surgeries',
      description: 'Pre-approved surgeries can be performed in Brazil or the United States.',
      color: 'text-green-600'
    },
    {
      icon: UserCheck,
      title: 'Fast Approval',
      description: 'No need for Social Security or Credit Score to be approved.',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-blue-100">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/plans"
                  className="flex-1 inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {t('home.hero.cta')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/about"
                  className="flex-1 inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-700 bg-white hover:bg-gray-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  {t('home.hero.secondary')}
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Join Today</h3>
                  <p className="text-blue-100">Start your application in minutes</p>
                </div>
                <div className="space-y-4">
                  {['Quick 5-minute signup', 'Choose your perfect plan', 'Get coverage immediately'].map((step, index) => (
                    <div key={index} className="flex items-center space-x-3 text-white">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <Button className="mt-6" size="lg" asChild>
                  <Link to="/enrollment">Get Started</Link>
                </Button>
              </div>
            </motion.div>
          </div>
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

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the benefits that make SaudeMAX the preferred choice for healthcare
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 text-lg">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate Leaderboard Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Top Affiliate Partners
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our growing network of affiliate partners who are helping more people access quality healthcare
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Become a SaudeMAX Affiliate</h3>
                <p className="text-gray-600">
                  Join our affiliate program and earn competitive commissions while helping others access quality healthcare solutions.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Earn up to 15% commission</p>
                      <p className="text-sm text-gray-600">On every successful referral</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Recurring revenue</p>
                      <p className="text-sm text-gray-600">Earn from monthly subscriptions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Marketing materials provided</p>
                      <p className="text-sm text-gray-600">Get everything you need to succeed</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button asChild>
                    <Link to="/affiliate/register">
                      <Users className="w-5 h-5 mr-2" />
                      Become an Affiliate
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <AffiliateLeaderboardWidget limit={5} showEarnings={true} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Health Plan for Brazilians Video Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Health Plan for Brazilians
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive healthcare coverage designed specifically for the Brazilian community
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {healthPlanFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Vimeo Video Embed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video">
                  <iframe
                    src="https://player.vimeo.com/video/1035717280?badge=0&autopause=0&player_id=0&app_id=58479&h=1bab1b87e8"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    title="SaudeMAX - Health Plan for Brazilians"
                    className="w-full h-full"
                    loading="lazy"
                  />
                </div>
              </div>
              
              {/* Fallback for if iframe still doesn't work */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="text-center text-white pointer-events-auto">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Watch Our Introduction Video</h3>
                  <p className="text-blue-100 mb-6">
                    Learn about our comprehensive health plan designed for Brazilians
                  </p>
                  <a
                    href="https://vimeo.com/1035717280"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Watch on Vimeo
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Plans Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingPreview />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('home.testimonials.title')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 text-lg">
                    "{t('home.testimonials.testimonial1.text')}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">M</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {t('home.testimonials.testimonial1.author')}
                      </div>
                      <div className="text-gray-600">
                        {t('home.testimonials.testimonial1.location')}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Join Our Community?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start your application today and Cut Your Medical Costs and Gain Peace of Mind
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/enrollment">
                Start Application
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};