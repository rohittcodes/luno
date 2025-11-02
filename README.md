# Luno - Financial Management Platform

A modern SaaS platform for managing finances with expense tracking, budgeting, subscriptions, and more.

## 🚀 Quick Setup (5 minutes)

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

**Email Verification:**
- ✅ Works automatically with Supabase (no extra setup needed)
- Email verification emails are sent by Supabase
- Customize templates: Supabase Dashboard → Authentication → Email Templates
- Configure redirect URLs: Authentication → Settings → Redirect URLs
  - Add: `http://localhost:3000/auth/callback` (dev)
  - Add: `https://your-domain.com/auth/callback` (production)

### 3. Create Environment File

Create `.env.local` in the project root:

```env
# ============================================
# REQUIRED - Core App
# ============================================
# Get from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your-64-character-hex-key-here

# ============================================
# RECOMMENDED - For Cron Jobs & Type Generation
# ============================================
# Get from: Supabase Dashboard → Settings → API → service_role secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_ID=your-project-id

# ============================================
# OPTIONAL - Feature-Specific (Add as needed)
# ============================================
# Lemon Squeezy (Payments) - See docs/setup/03-lemon-squeezy-setup.md
# LEMONSQUEEZY_STORE_URL=...
# LEMONSQUEEZY_API_KEY=...

# Resend (Email) - See docs/setup/06-resend-setup.md
# RESEND_API_KEY=...
# RESEND_FROM_EMAIL=...

# Composio (Integrations) - See docs/setup/04-tool-router-setup.md
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

---

## ✨ Features

- 💰 **Transactions** - Track income and expenses
- 📊 **Analytics** - Spending insights and trends
- 🎯 **Budgets** - Set limits and track progress
- 💳 **Accounts** - Manage multiple accounts
- 📁 **Categories** - Organize with hierarchies
- 🔔 **Notifications** - Bills and subscription reminders
- 🎯 **Goals** - Save for specific targets
- 👨‍👩‍👧‍👦 **Family Sharing** - Collaborate with household
- 🔌 **Integrations** - Bank sync, receipt scanning (optional)
- 📤 **Export** - Download data as CSV/JSON

---

## 📋 All Environment Variables

### 🔴 Required (Core App)

**Supabase (Database & Auth):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Dashboard → Settings → API
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Dashboard → Settings → API

**Security:**
- ✅ `ENCRYPTION_KEY` - Generate with `openssl rand -hex 32` (for payment data encryption)

### 🟡 Recommended (For Features)

**Supabase Service Role:**
- 🔔 `SUPABASE_SERVICE_ROLE_KEY` - **For cron jobs** (automated notifications)
- 🔔 `SUPABASE_PROJECT_ID` - **For type generation** (`bun run generate-types`)

### 🟢 Optional (Feature-Specific)

**Lemon Squeezy (Payments) - 6 variables:**
- `LEMONSQUEEZY_STORE_URL`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `LEMONSQUEEZY_PRO_VARIANT_ID`
- `LEMONSQUEEZY_FAMILY_VARIANT_ID`
- **Needed for:** Paid subscriptions, checkout, billing

**Resend (Email) - 2 variables:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- **Needed for:** Email bill reminders (in-app notifications work without it)
- **NOT needed for:** Email verification after signup (uses Supabase's built-in email)

**Composio (Integrations) - 1 variable:**
- `COMPOSIO_API_KEY`
- **Needed for:** Bank sync, receipt scanning, external integrations

**Next.js - 1 variable:**
- `NEXT_PUBLIC_APP_URL` - Auto-detected, optional

**Complete list:** See [Environment Variables Guide](./docs/setup/07-environment-variables.md)

---

## 📧 Email Verification

**Good news:** Email verification works automatically with Supabase! ✅

- After signup, Supabase sends verification email automatically
- No Resend or email service needed for auth emails
- Just configure redirect URLs in Supabase Dashboard:
  - Go to **Authentication → Settings → Redirect URLs**
  - Add: `http://localhost:3000/auth/callback` (dev)
  - Add: `https://your-domain.com/auth/callback` (production)

**Resend is only for:** Bill/subscription reminder emails (optional)

See [Email Verification Guide](./docs/setup/EMAIL_VERIFICATION.md) for details.

### What Works Without Each Key?

**Without Service Role Key:**
- ✅ Auth works (login, signup, password reset)
- ✅ All app features work
- ❌ Cron jobs won't run (no automated notifications)

**Without Encryption Key:**
- ✅ Auth works
- ✅ Most features work
- ❌ Payment features will fail (subscription metadata encryption)

**Without Lemon Squeezy Keys:**
- ✅ App works fully
- ❌ No paid subscriptions (users stuck on free tier)
- ❌ No checkout/billing features

**Without Resend Keys:**
- ✅ App works fully
- ✅ **Email verification works** (Supabase handles it automatically)
- ✅ Password reset emails work (Supabase handles it)
- ✅ In-app notifications work
- ❌ No bill/subscription reminder emails (only for cron jobs)

**Without Composio Key:**
- ✅ App works fully
- ❌ No external integrations (manual transaction entry only)

---

## 🔧 Optional Features

### Payments (Lemon Squeezy)
- Required for paid subscriptions
- See [Lemon Squeezy Setup](./docs/setup/03-lemon-squeezy-setup.md)

### Email Notifications (Resend)
- Required for email bill reminders (cron jobs)
- **NOT needed for** email verification after signup (Supabase handles this)
- See [Resend Setup](./docs/setup/06-resend-setup.md)

### External Integrations (Composio)
- Bank sync, receipt scanning, etc.
- See [Tool Router Setup](./docs/setup/04-tool-router-setup.md)

---

## 🛠 Tech Stack

- **Next.js 16** - React framework
- **Supabase** - Database, auth, Edge Functions
- **TypeScript** - Type safety
- **Tailwind CSS + Shadcn/ui** - Styling
- **TanStack Query** - Data fetching
- **Lemon Squeezy** - Payments (optional)

---

## 📖 Documentation

- **[Complete Setup Guide](./docs/setup/01-getting-started.md)** - Detailed walkthrough
- **[Environment Variables](./docs/setup/07-environment-variables.md)** - All env vars explained
- **[Database Migrations](./docs/guides/database-migrations.md)** - Schema changes
- **[All Guides](./docs/)** - Comprehensive documentation

---

## 🐛 Troubleshooting

**"Missing environment variable" error?**
- Check `.env.local` exists in project root
- Restart dev server after adding variables

**Database connection issues?**
- Verify Supabase URL and keys are correct
- Check Supabase project is active

**Need help?** See [Troubleshooting Guide](./docs/troubleshooting/common-issues.md)

---

## 📝 Scripts

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

---

## 🚀 Deploy

The easiest way to deploy is with [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

See [Vercel Setup Guide](./docs/setup/05-vercel-setup.md) for details.
