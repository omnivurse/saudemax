import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        plans: 'Plans',
        about: 'About',
        contact: 'Contact',
        login: 'Login',
        dashboard: 'Dashboard',
        enroll: 'Enroll Now'
      },
      // Homepage
      home: {
        hero: {
          title: 'Flexible Healthcare Plans for Brazilians in the USA',
          subtitle: 'Join thousands of families who have found quality health sharing solutions',
          cta: 'View Plans',
          secondary: 'Learn More'
        },
        features: {
          title: 'Why Choose SaudeMAX?',
          affordability: {
            title: 'Affordable Rates',
            description: 'Save up to 70% compared to traditional insurance'
          },
          community: {
            title: 'Strong Community',
            description: 'Join a caring community of health-conscious members'
          },
          support: {
            title: 'Concierge Support',
            description: 'Personal guidance to navigate your healthcare plan'
          }
        },
        testimonials: {
          title: 'What Our Members Say',
          testimonial1: {
            text: 'SaudeMAX saved our family thousands while providing excellent coverage.',
            author: 'Maria Santos',
            location: 'São Paulo, SP'
          }
        }
      },
      // Plans
      plans: {
        title: 'Choose Your Plan',
        subtitle: 'Find the perfect healthcare sharing plan for you and your family',
        filters: {
          individual: 'Individual',
          family: 'Family',
          all: 'All Plans'
        },
        card: {
          monthly: 'per month',
          deductible: 'Annual Deductible',
          benefits: 'Key Benefits',
          popular: 'Most Popular',
          select: 'Select Plan'
        }
      },
      // Enrollment
      enrollment: {
        title: 'Join SaudeMAX',
        steps: {
          personal: 'Personal Information',
          health: 'Health Information',
          review: 'Review & Submit'
        },
        personal: {
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'Email Address',
          phone: 'Phone Number',
          dateOfBirth: 'Date of Birth',
          address: 'Address'
        },
        health: {
          conditions: 'Do you have any pre-existing conditions?',
          medications: 'Current medications',
          hospitalization: 'Recent hospitalizations in the past 2 years?',
          smoking: 'Smoking status'
        },
        buttons: {
          next: 'Next',
          previous: 'Previous',
          submit: 'Submit Application'
        }
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success!',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        yes: 'Yes',
        no: 'No'
      }
    }
  },
  pt: {
    translation: {
      // Navigation
      nav: {
        home: 'Início',
        plans: 'Planos',
        about: 'Sobre',
        contact: 'Contato',
        login: 'Entrar',
        dashboard: 'Painel',
        enroll: 'Inscrever-se'
      },
      // Homepage
      home: {
        hero: {
          title: 'Planos de Saúde Flexíveis para Brasileiros nos EUA',
          subtitle: 'Junte-se a milhares de famílias que encontraram soluções de compartilhamento de saúde de qualidade',
          cta: 'Ver Planos',
          secondary: 'Saiba Mais'
        },
        features: {
          title: 'Por que Escolher SaudeMAX?',
          affordability: {
            title: 'Preços Acessíveis',
            description: 'Economize até 70% comparado aos seguros tradicionais'
          },
          community: {
            title: 'Comunidade Forte',
            description: 'Junte-se a uma comunidade cuidadosa de membros conscientes da saúde'
          },
          support: {
            title: 'Suporte Concierge',
            description: 'Orientação pessoal para navegar seu plano de saúde'
          }
        },
        testimonials: {
          title: 'O que Nossos Membros Dizem',
          testimonial1: {
            text: 'SaudeMAX economizou milhares para nossa família enquanto fornecia excelente cobertura.',
            author: 'Maria Santos',
            location: 'São Paulo, SP'
          }
        }
      },
      // Plans
      plans: {
        title: 'Escolha Seu Plano',
        subtitle: 'Encontre o plano de compartilhamento de saúde perfeito para você e sua família',
        filters: {
          individual: 'Individual',
          family: 'Família',
          all: 'Todos os Planos'
        },
        card: {
          monthly: 'por mês',
          deductible: 'Franquia Anual',
          benefits: 'Benefícios Principais',
          popular: 'Mais Popular',
          select: 'Selecionar Plano'
        }
      },
      // Enrollment
      enrollment: {
        title: 'Junte-se ao SaudeMAX',
        steps: {
          personal: 'Informações Pessoais',
          health: 'Informações de Saúde',
          review: 'Revisar e Enviar'
        },
        personal: {
          firstName: 'Nome',
          lastName: 'Sobrenome',
          email: 'Endereço de Email',
          phone: 'Número de Telefone',
          dateOfBirth: 'Data de Nascimento',
          address: 'Endereço'
        },
        health: {
          conditions: 'Você tem alguma condição pré-existente?',
          medications: 'Medicamentos atuais',
          hospitalization: 'Hospitalizações recentes nos últimos 2 anos?',
          smoking: 'Status de fumante'
        },
        buttons: {
          next: 'Próximo',
          previous: 'Anterior',
          submit: 'Enviar Candidatura'
        }
      },
      // Common
      common: {
        loading: 'Carregando...',
        error: 'Ocorreu um erro',
        success: 'Sucesso!',
        cancel: 'Cancelar',
        save: 'Salvar',
        edit: 'Editar',
        delete: 'Excluir',
        yes: 'Sim',
        no: 'Não'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Changed default language to English US
    fallbackLng: 'en', // Changed fallback language to English US
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;