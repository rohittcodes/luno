# Luno - Financial Management Platform

A modern SaaS platform for managing finances with expense tracking, budgeting, subscriptions, and more. Built with Composio's [Tool Router](https://docs.composio.dev/docs/tool-router/quick-start), [Rube MCP](https://rube.app), and [Claude Code](https://www.claude.com/product/claude-code).

## Setup

### 1. Install Dependencies

```bash
bun install
# or
npm install
```

### 2. Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project (free tier is fine)
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Create Environment File

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your-64-character-hex-key-here

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_ID=your-project-id

# LEMONSQUEEZY_STORE_URL=...
# LEMONSQUEEZY_API_KEY=...

# RESEND_API_KEY=...
# RESEND_FROM_EMAIL=...

# COMPOSIO_API_KEY=...
```

**Generate encryption key:**
```bash
openssl rand -hex 32
```

### 4. Set Up Database

```bash
# Push migrations to Supabase
npx supabase db push

# Generate TypeScript types
bun run generate-types
```

### 5. Start Development Server

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account!

**Email Verification:**
- After signup, users receive a verification email automatically (from Supabase)
- No Resend or email service needed for auth emails
- Click the link in email → redirects to `/auth/callback` → verified!

## Features

- Transactions, Analytics, Budgets, Accounts, Categories, Notifications, Goals, Family Sharing, Integrations, Export

## Optional Features

## Tech Stack

- **Next.js 16** - React framework
- **Supabase** - Database, auth, Edge Functions
- **TypeScript** - Type safety
- **Tailwind CSS + Shadcn/ui** - Styling
- **TanStack Query** - Data fetching
- **Lemon Squeezy** - Payments (optional)

## Scripts

```bash
# Development
bun dev                 # Start dev server

# Build
bun run build          # Production build
bun start              # Start production server

# Database
npx supabase db push   # Push migrations
bun run generate-types # Generate TypeScript types
```

## Deploy

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!
