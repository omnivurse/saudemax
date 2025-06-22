import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Users, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.plans'), href: '/plans' },
    { name: 'Rules', href: '/rules' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' }
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/SAUDEMAX_logo1 (1) copy.png" 
              alt="SAUDEMAX" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? 'text-blue-700'
                    : 'text-gray-700 hover:text-blue-700'
                }`}
              >
                {item.name}
                {location.pathname === item.href && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="p-2 text-gray-600 hover:text-blue-700 transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-5 h-5" />
            </button>
            <Link
              to="/affiliate/register"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-300 rounded-lg hover:border-blue-700 flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Become Affiliate
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-300 rounded-lg hover:border-blue-700"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/affiliate-login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-300 rounded-lg hover:border-blue-700 flex items-center"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Affiliate Login
            </Link>
            <Link
              to="/enrollment"
              className="px-6 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors rounded-lg"
            >
              {t('nav.enroll')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-blue-700 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-100 py-4"
            >
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-3 py-2 text-base font-medium ${
                      location.pathname === item.href
                        ? 'text-blue-700 bg-blue-50 rounded-lg'
                        : 'text-gray-700 hover:text-blue-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-700"
                  >
                    <Globe className="w-5 h-5" />
                    <span>{i18n.language === 'en' ? 'Português' : 'English'}</span>
                  </button>
                  <div className="flex flex-col space-y-2">
                    <Link
                      to="/affiliate/register"
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-300 rounded-lg hover:border-blue-700 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Become Affiliate
                    </Link>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-300 rounded-lg hover:border-blue-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/affiliate-login"
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors border border-gray-300 rounded-lg hover:border-blue-700 flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Affiliate Login
                    </Link>
                    <Link
                      to="/enrollment"
                      className="px-6 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('nav.enroll')}
                    </Link>
                  </div>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};