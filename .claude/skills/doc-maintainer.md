---
skill: doc-maintainer
dependencies:
  - notion (via Rube MCP)
  - github (via Rube MCP)
  - context7 MCP
description: Maintain comprehensive documentation in Notion for the finance app
tags: [documentation, notion, knowledge-base]
---

# Documentation Maintainer

Create and maintain comprehensive documentation in Notion for the finance app, synchronized with code changes.

## What this skill does

1. **Create technical documentation** - API docs, architecture, database schema
2. **Write user guides** - Feature documentation and tutorials
3. **Maintain changelog** - Track releases and updates
4. **Document integrations** - Tool Router connections, external APIs
5. **Keep docs in sync** - Update when code changes

## When to use this skill

- After completing a new feature
- When database schema changes
- After adding new integrations
- For API endpoint documentation
- Creating onboarding guides
- Documenting architecture decisions

## Notion Structure for Finance App

```
📚 Luno Finance App Documentation
│
├── 🎯 Overview
│   ├── Product Vision
│   ├── Feature Roadmap
│   └── Tech Stack
│
├── 🏗️ Architecture
│   ├── System Design
│   ├── Database Schema
│   ├── API Architecture
│   ├── Authentication Flow
│   └── Tool Router Integration
│
├── 💻 Development
│   ├── Getting Started
│   ├── Local Development Setup
│   ├── Environment Variables
│   ├── Coding Standards
│   └── Git Workflow
│
├── 📊 Database
│   ├── Schema Overview
│   ├── Tables Reference
│   ├── Functions & Triggers
│   ├── RLS Policies
│   └── Migrations Guide
│
├── 🔌 API Reference
│   ├── Authentication
│   ├── Transactions API
│   ├── Budgets API
│   ├── Categories API
│   ├── Analytics API
│   └── Integrations API
│
├── 🔧 Integrations
│   ├── Tool Router Setup
│   ├── Bank Connections
│   ├── Payment Processors
│   ├── Receipt Scanners
│   └── Third-party APIs
│
├── 🎨 Frontend
│   ├── Component Library
│   ├── State Management
│   ├── Routing
│   ├── Forms & Validation
│   └── Charts & Visualizations
│
├── 📱 Features
│   ├── Transaction Management
│   ├── Budget Tracking
│   ├── Analytics Dashboard
│   ├── Goals & Savings
│   ├── Recurring Transactions
│   └── External Syncing
│
├── 🧪 Testing
│   ├── Testing Strategy
│   ├── Unit Tests
│   ├── Integration Tests
│   ├── E2E Tests
│   └── Test Data
│
├── 🚀 Deployment
│   ├── Deployment Process
│   ├── Environment Setup
│   ├── CI/CD Pipeline
│   └── Monitoring & Logging
│
├── 📖 User Guides
│   ├── Getting Started
│   ├── Adding Transactions
│   ├── Setting Budgets
│   ├── Connecting Bank Accounts
│   ├── Understanding Analytics
│   └── FAQ
│
└── 📝 Changelog
    ├── v1.0.0 - Initial Release
    ├── v1.1.0 - Budget Features
    └── v1.2.0 - Tool Router Integration
```

## Documentation Templates

### Feature Documentation Template
```markdown
# Feature Name

## Overview
Brief description of the feature and its purpose.

## User Story
As a [user type], I want to [action] so that [benefit].

## Technical Implementation

### Database Changes
- Tables: List of new/modified tables
- Functions: New database functions
- Indexes: Performance indexes added

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST   | /api/... | ...         | Yes           |

### Frontend Components
- ComponentName.tsx - Purpose
- HookName.ts - Purpose

### Tool Router Integration
If applicable:
- Toolkits used: [toolkit1, toolkit2]
- Authentication flow
- Data sync process

## User Guide

### How to Use
1. Step 1
2. Step 2
3. Step 3

### Screenshots
[Include screenshots with annotations]

## Edge Cases & Limitations
- Edge case 1: How it's handled
- Limitation 1: Why it exists

## Testing
- Unit tests: Location
- Integration tests: Location
- Manual testing checklist

## Future Improvements
- Improvement 1
- Improvement 2

## Related Documentation
- [Link to related feature]
- [Link to API docs]
```

### API Endpoint Documentation Template
```markdown
# Endpoint Name

## Request

### Method
`POST`

### URL
`/api/transactions`

### Authentication
Required. User must be authenticated via Supabase Auth.

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"
}
```

### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | number | Yes | Transaction amount (positive) |
| type | string | Yes | "income" or "expense" |
| category_id | uuid | Yes | Category UUID |
| description | string | No | Transaction description |
| transaction_date | date | Yes | Date in ISO format |

### Example Request
```json
{
  "amount": 125.50,
  "type": "expense",
  "category_id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Grocery shopping",
  "transaction_date": "2025-01-15"
}
```

## Response

### Success Response (201 Created)
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "user_id": "770e8400-e29b-41d4-a716-446655440000",
  "amount": 125.50,
  "type": "expense",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Groceries",
    "icon": "🛒"
  },
  "description": "Grocery shopping",
  "transaction_date": "2025-01-15",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid amount",
  "details": "Amount must be a positive number"
}
```

**401 Unauthorized**
```json
{
  "error": "Authentication required"
}
```

**404 Not Found**
```json
{
  "error": "Category not found"
}
```

## Notes
- Amounts are stored with 2 decimal precision
- Dates are in user's timezone
- Transaction triggers budget recalculation
```

### Database Schema Documentation Template
```markdown
# Table Name: transactions

## Purpose
Stores all financial transactions (income, expenses, transfers) for users.

## Schema
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | Foreign key to auth.users |
| account_id | uuid | Yes | - | Foreign key to accounts |
| category_id | uuid | Yes | - | Foreign key to categories |
| amount | numeric(12,2) | No | - | Transaction amount |
| type | text | No | - | 'income', 'expense', or 'transfer' |
| description | text | Yes | - | Transaction description |
| transaction_date | date | No | - | Date of transaction |
| created_at | timestamp | No | now() | Record creation time |

## Indexes
```sql
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
```

## RLS Policies
- Users can only access their own transactions
- All CRUD operations scoped to auth.uid()

## Related Tables
- categories: transaction categorization
- accounts: account balances
- budgets: budget tracking

## Triggers
- `update_account_balance`: Updates account.balance on insert/update/delete
- `check_budget_threshold`: Checks if transaction exceeds budget

## Example Queries

### Get transactions for current month
```sql
SELECT * FROM transactions
WHERE user_id = auth.uid()
  AND transaction_date >= date_trunc('month', CURRENT_DATE)
ORDER BY transaction_date DESC;
```

### Get spending by category
```sql
SELECT
  c.name,
  SUM(t.amount) as total
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = auth.uid()
  AND t.type = 'expense'
  AND t.transaction_date >= date_trunc('month', CURRENT_DATE)
GROUP BY c.name
ORDER BY total DESC;
```
```

### Integration Documentation Template
```markdown
# Integration: Plaid Bank Sync

## Overview
Allows users to connect bank accounts via Plaid for automatic transaction import.

## Setup

### Prerequisites
- Composio account with Tool Router enabled
- Plaid developer account (for testing)
- Tool Router configured in app

### Environment Variables
```env
COMPOSIO_API_KEY=your_key
PLAID_TOOLKIT_ENABLED=true
```

### Database Setup
```sql
-- External connections table tracks Plaid links
CREATE TABLE external_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  toolkit_name TEXT DEFAULT 'plaid',
  connection_id TEXT,
  institution_name TEXT,
  status TEXT DEFAULT 'active'
);
```

## User Flow

### 1. Initiate Connection
User clicks "Connect Bank" → Opens Plaid Link modal

### 2. Authenticate
User logs into their bank via Plaid's secure flow

### 3. Select Accounts
User chooses which accounts to sync

### 4. Confirmation
Connection saved, initial sync starts

## Technical Implementation

### Create Tool Router Session
```typescript
const session = await toolRouter.createSession(userId, {
  toolkits: ['plaid']
})
```

### Handle Authentication
```typescript
// Tool Router provides auth URL
const authUrl = session.authUrl

// User completes auth in popup
// Webhook notifies when complete
```

### Sync Transactions
```typescript
const agent = new Agent({
  name: 'BankSyncAgent',
  tools: [hostedMcpTool({ serverUrl: session.url })]
})

const result = await run(agent,
  `Fetch transactions from ${institution} for the last 30 days`
)
```

### Import to Database
```typescript
// Parse agent response
const transactions = parseTransactions(result.finalOutput)

// Insert with duplicate detection
for (const txn of transactions) {
  await supabase.from('transactions').upsert({
    user_id: userId,
    external_id: txn.id,
    amount: txn.amount,
    description: txn.description,
    // ...
  })
}
```

## Data Mapping

| Plaid Field | App Field | Transform |
|-------------|-----------|-----------|
| amount | amount | Math.abs() |
| name | description | Normalize |
| date | transaction_date | Parse ISO |
| category | category_id | Map to app categories |
| account_id | account_id | Lookup connection |

## Error Handling

### Authentication Errors
- Expired credentials → Prompt re-authentication
- Invalid credentials → Show error, allow retry

### Sync Errors
- API rate limit → Queue for later, show message
- Network error → Retry with exponential backoff
- Invalid data → Log error, skip transaction

## Testing

### Test with Plaid Sandbox
```typescript
// Use sandbox credentials
const testInstitution = 'ins_109508'
const testUsername = 'user_good'
const testPassword = 'pass_good'
```

### Manual Testing Checklist
- [ ] Connect new account
- [ ] Sync transactions
- [ ] Handle duplicates correctly
- [ ] Disconnect account
- [ ] Re-authenticate expired connection

## Monitoring

### Metrics to Track
- Successful syncs per day
- Failed sync reasons
- Average sync duration
- Duplicate transaction rate

### Alerts
- Alert if sync fails for >24 hours
- Alert if duplicate rate >5%
- Alert if auth failure rate >10%

## Limitations
- Historical data: 2 years maximum
- Sync frequency: Once per day (Plaid limit)
- Some institutions not supported

## Related Documentation
- [Tool Router Integration](link)
- [Transactions API](link)
- [Database Schema](link)
```

## Workflow Steps

### Step 1: Determine Documentation Need
```
After completing a feature or making significant changes:
- Is this a new feature? → Feature docs
- Did database change? → Schema docs
- New API endpoint? → API docs
- External integration? → Integration docs
```

### Step 2: Use Notion MCP to Create/Update
```
- Create new page with appropriate template
- Add to correct section in hierarchy
- Link to related documentation
- Add to changelog if user-facing
```

### Step 3: Add Code Examples
```
- Include real code from the project
- Test all code examples
- Add comments for clarity
- Show both success and error cases
```

### Step 4: Add Visual Aids
```
- Screenshots with annotations
- Architecture diagrams
- Sequence diagrams for complex flows
- Database ER diagrams
```

### Step 5: Link to GitHub
```
- Link to relevant PR
- Link to source files
- Link to tests
- Add commit SHA for reference
```

### Step 6: Review & Publish
```
- Proofread for clarity
- Verify all links work
- Test code examples
- Get team review if needed
```

## Auto-Documentation Triggers

When certain code changes occur, automatically update docs:

### New API Endpoint Added
```
Trigger: New file in app/api/**
Action: Create API doc from route handler
Extract: Method, path, request/response types
```

### Database Migration
```
Trigger: New file in supabase/migrations/**
Action: Update schema docs
Extract: Table changes, new functions, RLS policies
```

### New Component Created
```
Trigger: New file in components/**
Action: Add to component library docs
Extract: Props, usage example, variants
```

### Integration Added
```
Trigger: New Tool Router toolkit configured
Action: Create integration guide
Extract: Toolkit name, purpose, auth flow
```

## Output Format

Provide:
1. Notion page structure
2. Content for each section
3. Code examples with syntax highlighting
4. Screenshots or diagrams
5. Links to related docs
6. Changelog entry

## Example Usage

"Document the new budget tracking feature including API endpoints, database schema, and user guide"

Expected output:
1. Feature documentation page in Notion
2. API reference for budget endpoints
3. Database schema documentation for budgets table
4. User guide with screenshots
5. Integration guide if Tool Router used
6. Updated changelog
7. Links to GitHub PR and source code
