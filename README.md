# Truth Me Up - Interactive Catholic Teaching Platform

A comprehensive Next.js application that provides AI-powered access to the Catechism of the Catholic Church with subscription-based features, user authentication, and intelligent search capabilities.

## Features

### Search & Discovery

- **Semantic Search**: AI-powered search through the entire Catechism using vector embeddings
- **Keyword Search**: Traditional text-based search with full-text capabilities
- **Paragraph Lookup**: Direct access to specific Catechism paragraphs by number
- **Interactive References**: Clickable CCC references throughout responses

### AI Chat Interface

- **AI-Powered Q&A**: Ask questions about Catholic teaching and receive contextual responses
- **GPT-4 Integration**: Advanced AI responses based on Catechism content
- **Response Management**: Save, copy, and organize AI responses
- **Usage Tracking**: Token-based usage limits with daily reset

### User Management

- **Supabase Authentication**: Secure user registration and login
- **Magic Link Login**: Passwordless authentication option
- **Usage Analytics**: Track daily usage and remaining limits
- **Account Management**: Profile and subscription management

### Subscription System

- **Stripe Integration**: Secure payment processing
- **Multiple Plans**: Personal, Small Group, and Large Group options
- **Usage Limits**: Token-based limits for free users, unlimited for subscribers
- **Billing Management**: Cancel subscriptions and view billing history

### Content Management

- **Saved Responses**: Bookmark and organize favorite responses
- **Expandable UI**: Collapsible response cards with smooth animations
- **Search Filters**: Semantic and keyword search for saved responses
- **Export Features**: Copy responses to clipboard

### Advanced Features

- **Test User System**: Feature gating for beta testing and experimental features
- **Local Storage Fallback**: Anonymous usage tracking for non-authenticated users
- **Responsive Design**: Mobile-first design with progressive enhancement
- **Dark Mode Ready**: Component system supports theming

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account (for subscriptions)
- SendGrid account (for email notifications)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd mycat
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Stripe Price IDs for different plans
STRIPE_PERSONAL_PRICE_ID=price_xxx
STRIPE_SMALL_GROUP_PRICE_ID=price_xxx
STRIPE_LARGE_GROUP_PRICE_ID=price_xxx

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email

# App Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. **Set up your Supabase database:**

Create the following tables and enable RLS:

```sql
-- Catechism paragraphs with vector embeddings
CREATE TABLE ccc_paragraphs (
  id SERIAL PRIMARY KEY,
  paragraph_number INTEGER NOT NULL UNIQUE,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan_name TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily usage tracking
CREATE TABLE daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- User saved responses
CREATE TABLE user_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. **Enable required Supabase extensions:**

```sql
-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
```

5. **Set up RLS policies:**

```sql
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON daily_usage
FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own responses
CREATE POLICY "Users can manage own responses" ON user_responses
FOR ALL USING (auth.uid() = user_id);
```

6. **Populate the Catechism data:**

```bash
# Scrape and embed Catechism content
npm run scrape
npm run embed
```

7. **Start the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── billing/              # Stripe billing endpoints
│   │   ├── chat/                 # AI chat API
│   │   ├── ccc/                  # Catechism paragraph API
│   │   ├── contact/              # Contact form API
│   │   ├── search/               # Search API
│   │   └── user-responses/       # Saved responses API
│   ├── auth/                     # Authentication pages
│   ├── chat/                     # AI chat interface
│   ├── search/                   # Search interface
│   ├── saved-responses/          # User response management
│   ├── account/                  # User account management
│   ├── options/                  # Subscription options
│   ├── about/                    # About page
│   └── contact/                  # Contact page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── SearchBar.tsx             # Reusable search component
│   ├── UsageAlertDialog.tsx      # Usage limit notifications
│   ├── AuthButton.tsx            # Authentication UI
│   └── NavigationWrapper.tsx     # Navigation components
├── lib/
│   ├── supabase/                 # Supabase client configurations
│   ├── usageTracking.ts          # Usage tracking and limits
│   ├── openai.ts                 # OpenAI integration
│   └── utils.ts                  # Utility functions
├── utils/
│   ├── copyResponse.ts           # Response copying utility
│   └── linkifyCCC.ts             # CCC reference linking
└── scripts/
    ├── scrape_ccc.ts             # Catechism content scraper
    └── embed_ccc.ts              # Content embedding generator
```

## Key Technologies

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Modern React component library
- **[Supabase](https://supabase.com/)** - Backend as a Service with PostgreSQL
- **[pgvector](https://github.com/pgvector/pgvector)** - Vector similarity search
- **[OpenAI API](https://openai.com/)** - GPT-4 integration for AI responses
- **[Stripe](https://stripe.com/)** - Payment processing and subscriptions
- **[SendGrid](https://sendgrid.com/)** - Email notifications
- **[Radix UI](https://www.radix-ui.com/)** - Accessible UI primitives

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure token-based authentication
- **Stripe Webhook Verification** - Secure payment processing
- **Input Validation** - Zod schema validation
- **Rate Limiting** - Usage-based token limits
- **Test User System** - Feature gating for safe deployments

## Deployment

The application is designed to be deployed on Vercel with the following configuration:

1. **Environment Variables**: Set all required environment variables in your deployment platform
2. **Domain Configuration**: Update `NEXT_PUBLIC_SITE_URL` to your production domain
3. **Stripe Webhooks**: Configure webhook endpoints to point to your production API
4. **Database Migrations**: Ensure all Supabase tables and RLS policies are set up

## 📈 Usage Analytics

The application includes comprehensive usage tracking:

- **Anonymous Users**: Local storage-based tracking with daily limits
- **Authenticated Users**: Database-backed usage tracking
- **Subscribers**: Unlimited usage with subscription validation
- **Test Users**: Special privileges for testing new features

## License

## MIT License - see LICENSE file for details.

**Truth Me Up** - Bringing Catholic teaching into the digital age with AI-powered accessibility and modern user experience.
