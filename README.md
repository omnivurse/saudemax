# SaudeMAX - Healthcare Sharing Platform

![SaudeMAX Logo](public/SAUDEMAX_logo1%20(1)%20copy.png)

## Overview

SaudeMAX is a comprehensive healthcare sharing platform designed specifically for the Brazilian community. The platform offers affordable healthcare plans, telemedicine services, and a robust member portal for managing healthcare needs.

## Features

- **Member Portal**: Complete dashboard for members to manage their healthcare
- **Enrollment System**: Multi-step enrollment wizard with plan selection
- **Share Request System**: Submit and track medical expense sharing requests
- **Billing Management**: View and manage payment history and methods
- **Document Center**: Access and download important documents
- **Support System**: Integrated support ticket and chat system
- **Affiliate Program**: Complete affiliate marketing system with tracking and commissions

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payment Processing**: Authorize.Net integration
- **Internationalization**: i18next for multi-language support (English/Portuguese)
- **Build Tool**: Vite

## Project Structure

```
├── backend/                # Node.js backend for payment processing
│   ├── routes/             # Express routes
│   └── server.js           # Main server file
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── admin/          # Admin-specific components
│   │   ├── affiliate/      # Affiliate system components
│   │   ├── auth/           # Authentication components
│   │   ├── enrollment/     # Enrollment wizard components
│   │   ├── layout/         # Layout components (Header, Footer, etc.)
│   │   ├── payment/        # Payment processing components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and libraries
│   ├── pages/              # Page components
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── i18n/               # Internationalization setup
├── supabase/
│   ├── functions/          # Supabase Edge Functions
│   └── migrations/         # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Authorize.Net account (for payment processing)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/saudemax.git
   cd saudemax
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your Supabase and Authorize.Net credentials.

4. Start the development server
   ```bash
   npm run dev
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the migrations in the `supabase/migrations` directory
3. Set up storage buckets for documents and images
4. Configure authentication providers

## Database Schema

The application uses a comprehensive database schema with the following main tables:

- `users` - User profiles and authentication
- `member_profiles` - Member information and plan details
- `member_dependents` - Family members covered under plans
- `documents` - Member documents (ID cards, guidelines, etc.)
- `share_requests` - Medical expense sharing requests
- `billing_records` - Payment history and invoices
- `support_tickets` - Customer support tickets
- `affiliates` - Affiliate program participants
- `affiliate_referrals` - Referral tracking and commissions

## Role-Based Access Control

The system implements a secure role-based access control system with the following roles:

- **Admin**: Full system access
- **Advisor**: Access to assigned members and support
- **Member**: Access to own profile, claims, and support
- **Affiliate**: Access to affiliate dashboard and commission data

## Deployment

### Frontend Deployment

```bash
npm run build
```

The build output will be in the `dist` directory, which can be deployed to any static hosting service.

### Backend Deployment

The backend can be deployed to any Node.js hosting service:

```bash
cd backend
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.io/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)