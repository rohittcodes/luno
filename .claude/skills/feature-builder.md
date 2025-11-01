---
skill: feature-builder
dependencies:
  - linear (via Rube MCP)
  - github (via Rube MCP)
  - supabase (via Rube MCP)
  - notion (via Rube MCP)
  - context7 MCP
description: End-to-end feature development workflow from planning to deployment
tags: [feature, development, workflow, agile]
---

# Feature Builder Workflow

Complete feature development lifecycle from Linear issue to production deployment.

## What this skill does

1. **Fetch feature requirements** from Linear
2. **Create implementation plan** with technical breakdown
3. **Generate database migrations** if needed
4. **Build components and logic**
5. **Create GitHub PR** with proper documentation
6. **Update Linear status** through development stages
7. **Document in Notion** for team reference

## When to use this skill

- Starting work on a new Linear issue
- Building complete features (not just bug fixes)
- Features requiring multiple components (frontend + backend + database)
- Team projects requiring documentation

## Finance App Feature Types

### Transaction Management Features
- Add/edit/delete transactions
- Bulk import from CSV
- Receipt scanning and attachment
- Transaction search and filtering
- Duplicate detection

### Analytics Features
- Spending trends analysis
- Category breakdown charts
- Month-over-month comparisons
- Budget vs actual tracking
- Income sources analysis

### Budget Features
- Create budget categories
- Set spending limits
- Budget alerts and notifications
- Rollover unused budget
- Budget templates

### Integration Features
- Bank account syncing (via Tool Router)
- Payment processor connections
- Receipt scanner integration
- Export to accounting software
- Calendar sync for recurring transactions

### Goal Features
- Savings goals
- Debt payoff tracking
- Investment tracking
- Goal progress visualization
- Milestone notifications

## Workflow Steps

### Step 1: Fetch Linear Issue
```
Use Linear MCP to:
- Get issue details (title, description, requirements)
- Fetch any attached designs or specs
- Review comments and discussions
- Check priority and labels
- Identify related issues
```

### Step 2: Create Implementation Plan
```
Break down into:
1. Database changes needed
   - New tables or columns
   - Migrations required
   - RLS policies

2. Backend/API changes
   - Supabase functions or Edge Functions
   - API endpoints
   - Data validation

3. Frontend components
   - New components to create
   - Existing components to modify
   - Routing changes

4. External integrations
   - Tool Router connections needed
   - Third-party APIs
   - Webhooks

5. Testing requirements
   - Unit tests
   - Integration tests
   - E2E tests

Update Linear with implementation plan in comments.
```

### Step 3: Database Setup
```
If database changes needed:
- Use database-architect skill
- Create migrations
- Apply to dev environment
- Generate TypeScript types
- Commit schema changes
```

### Step 4: Backend Development
```
Create:
- Supabase database functions
- Edge Functions for business logic
- API routes in Next.js
- Data validation schemas (Zod)
- Error handling
- Rate limiting if needed

For Tool Router integrations:
- Define tool discovery patterns
- Handle authentication flows
- Implement retry logic
- Cache external API responses
```

### Step 5: Frontend Development
```
Build:
- UI components (use design-to-code skill if Figma designs available)
- React Query hooks for data fetching
- Form handling with validation
- Loading and error states
- Optimistic updates
- Real-time subscriptions

Finance-specific considerations:
- Currency formatting
- Number precision (use decimal libraries)
- Date/time handling
- Chart visualizations
- Mobile responsiveness
```

### Step 6: Testing
```
Write:
- Unit tests (Vitest/Jest)
- Component tests (React Testing Library)
- Integration tests
- E2E tests if critical flow

Test scenarios:
- Happy path
- Error handling
- Edge cases (negative amounts, future dates)
- Concurrent updates
- Offline behavior
```

### Step 7: Documentation
```
Update Notion with:
- Feature overview
- Technical architecture
- API documentation
- User guide
- Known limitations
- Future improvements

Create:
- README updates if needed
- Inline code comments
- JSDoc for complex functions
```

### Step 8: Create GitHub PR
```
Use GitHub MCP to:
- Create feature branch
- Commit changes with conventional commits
- Push to remote
- Create PR with template:
  - Feature description
  - Linear issue link
  - Screenshots/videos
  - Testing checklist
  - Breaking changes
  - Deployment notes
```

### Step 9: Update Linear Status
```
Throughout development:
- Move to "In Progress" when starting
- Add implementation notes
- Update estimates if needed
- Move to "In Review" when PR created
- Link GitHub PR
- Move to "Done" when merged
```

## Example Feature: Budget Tracking

### Requirements (from Linear)
"As a user, I want to set monthly budgets for different expense categories and receive alerts when I'm approaching or exceeding my limits."

### Implementation Plan

**Database:**
- Create `budgets` table (already exists)
- Create `budget_alerts` table for notification history
- Add function to calculate budget utilization

**Backend:**
- Edge Function to check budgets daily
- Webhook for real-time transaction checks
- Email notification service integration

**Frontend:**
- Budget creation form component
- Budget dashboard with progress bars
- Alert settings component
- Budget history view
- Category spending breakdown

**Tool Router:**
- Optional: Connect to calendar for budget period reminders
- Optional: Integration with banking apps for real-time balance

### File Structure
```
app/
  (dashboard)/
    budgets/
      page.tsx                    # Budget dashboard
      new/
        page.tsx                  # Create budget form
      [id]/
        page.tsx                  # Budget detail view
        edit/
          page.tsx                # Edit budget
components/
  budgets/
    BudgetCard.tsx               # Budget display component
    BudgetForm.tsx               # Budget form
    BudgetProgress.tsx           # Progress bar with alerts
    BudgetAlertSettings.tsx      # Alert configuration
lib/
  hooks/
    useBudgets.ts                # React Query hooks
    useBudgetAlerts.ts
  validations/
    budget.schema.ts             # Zod schemas
supabase/
  migrations/
    20250101_create_budgets.sql
    20250101_create_budget_alerts.sql
  functions/
    check-budgets/
      index.ts                   # Daily budget check function
```

## Tool Router Integration Pattern

For features requiring external services:

```typescript
// Example: Connect bank account for automatic transaction import
import { toolRouter } from '@/lib/tool-router'

async function connectBankAccount(userId: string) {
  // 1. Create Tool Router session
  const session = await toolRouter.createSession(userId, {
    toolkits: ['plaid', 'yodlee'] // Financial data aggregators
  })

  // 2. User authenticates via provided URL
  const authUrl = session.authUrl

  // 3. Handle callback and store connection
  const connection = await toolRouter.getConnection(session.id)

  // 4. Sync transactions
  const transactions = await toolRouter.executeTool({
    tool: 'PLAID_GET_TRANSACTIONS',
    params: { startDate, endDate }
  })

  // 5. Import to database
  await importTransactions(transactions)
}
```

## Conventional Commit Messages

```
feat(budgets): add monthly budget tracking with alerts
fix(transactions): correct decimal precision in calculations
chore(deps): update supabase client to v2.38.0
docs(api): document budget API endpoints
test(budgets): add tests for budget alert threshold
refactor(components): extract shared form components
```

## PR Template

```markdown
## Description
Implements monthly budget tracking with customizable alerts.

## Linear Issue
Closes LUN-123

## Changes
- Created budgets database schema with RLS policies
- Built budget creation and management UI
- Implemented real-time budget utilization tracking
- Added email alerts for budget thresholds
- Created Edge Function for daily budget checks

## Screenshots
[Attach screenshots]

## Testing
- [ ] Budget CRUD operations work correctly
- [ ] Alerts trigger at correct thresholds
- [ ] Budget calculations are accurate
- [ ] Mobile responsive
- [ ] Real-time updates working

## Deployment Notes
- Run migration: `supabase db push`
- Set env var: `BUDGET_ALERT_EMAIL_TEMPLATE_ID`
```

## Output Format

Provide:
1. Implementation plan (detailed breakdown)
2. All code files generated
3. Migration files
4. Test files
5. Documentation updates
6. GitHub PR link
7. Updated Linear issue status

## Example Usage

"Build the feature from Linear issue LUN-234 - Add recurring transaction support"

Expected workflow:
1. Fetch LUN-234 from Linear
2. Create implementation plan
3. Generate all required code
4. Create GitHub PR
5. Update Linear with progress
6. Document in Notion
