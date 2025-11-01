---
skill: database-architect
dependencies:
  - supabase (via Rube MCP)
  - github (via Rube MCP)
description: Design and manage Supabase database schema for finance app
tags: [database, backend, schema, migrations]
---

# Database Architecture for Finance App

Design, create, and manage the Supabase PostgreSQL database schema with Row Level Security (RLS) policies.

## What this skill does

1. **Schema Design** - Create optimized database structures for financial data
2. **Migration Management** - Generate and apply database migrations
3. **RLS Policies** - Implement secure data access patterns
4. **Type Generation** - Create TypeScript types from database schema
5. **Performance Optimization** - Add indexes, views, and functions

## When to use this skill

- Setting up new database tables
- Modifying existing schemas
- Adding new features requiring data storage
- Optimizing query performance
- Implementing data security policies

## Core Tables for Finance App

### users_profile
```sql
- id (uuid, FK to auth.users)
- email (text)
- full_name (text)
- currency_preference (text, default 'USD')
- timezone (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### accounts
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- name (text) - e.g., "Main Checking", "Savings"
- type (text) - checking, savings, credit_card, cash
- balance (numeric(12,2))
- currency (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### categories
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- name (text)
- type (text) - expense, income
- icon (text) - icon identifier
- color (text) - hex color
- parent_category_id (uuid, FK) - for subcategories
- is_system (boolean) - predefined vs custom
- created_at (timestamp)
```

### transactions
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- account_id (uuid, FK)
- category_id (uuid, FK)
- amount (numeric(12,2))
- type (text) - expense, income, transfer
- description (text)
- transaction_date (date)
- payment_method (text)
- receipt_url (text)
- notes (text)
- tags (text[])
- is_recurring (boolean)
- recurring_rule_id (uuid, FK)
- external_id (text) - for synced transactions
- created_at (timestamp)
- updated_at (timestamp)
```

### budgets
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- category_id (uuid, FK)
- amount (numeric(12,2))
- period (text) - weekly, monthly, yearly
- start_date (date)
- end_date (date)
- alert_threshold (numeric(3,2)) - e.g., 0.80 for 80%
- is_active (boolean)
- created_at (timestamp)
```

### recurring_rules
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- frequency (text) - daily, weekly, monthly, yearly
- interval (integer) - every X days/weeks/months
- start_date (date)
- end_date (date)
- next_occurrence (date)
- template_data (jsonb) - transaction template
- is_active (boolean)
```

### goals
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- name (text)
- target_amount (numeric(12,2))
- current_amount (numeric(12,2))
- deadline (date)
- category_id (uuid, FK)
- status (text) - active, completed, cancelled
- created_at (timestamp)
```

### connections
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- integration_type (text) - bank, payment_processor, etc.
- connection_id (text) - Tool Router connection ID
- institution_name (text)
- last_synced_at (timestamp)
- status (text) - active, error, disconnected
- metadata (jsonb)
```

## Essential Database Functions

### calculate_account_balance
```sql
CREATE OR REPLACE FUNCTION calculate_account_balance(account_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    SUM(
      CASE
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        ELSE 0
      END
    ), 0
  )
  FROM transactions
  WHERE account_id = account_uuid;
$$ LANGUAGE SQL;
```

### get_spending_by_category
```sql
CREATE OR REPLACE FUNCTION get_spending_by_category(
  user_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(category_name TEXT, total_amount NUMERIC) AS $$
  SELECT
    c.name,
    SUM(t.amount)
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.user_id = user_uuid
    AND t.type = 'expense'
    AND t.transaction_date BETWEEN start_date AND end_date
  GROUP BY c.name
  ORDER BY SUM(t.amount) DESC;
$$ LANGUAGE SQL;
```

### check_budget_status
```sql
CREATE OR REPLACE FUNCTION check_budget_status(budget_uuid UUID)
RETURNS JSON AS $$
  -- Returns budget progress with alerts
$$ LANGUAGE PLPGSQL;
```

## Row Level Security Policies

### Implement user isolation
```sql
-- Users can only see their own data
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);
```

## Indexes for Performance

```sql
-- Transaction queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);

-- Text search
CREATE INDEX idx_transactions_description ON transactions USING gin(to_tsvector('english', description));

-- Budget tracking
CREATE INDEX idx_budgets_user_active ON budgets(user_id) WHERE is_active = true;
```

## Real-time Subscriptions Setup

```sql
-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
```

## Workflow Steps

### Step 1: Analyze Requirements
```
- Understand the feature data needs
- Identify relationships with existing tables
- Consider query patterns
- Plan for scalability
```

### Step 2: Design Schema
```
- Create table structure
- Define constraints and foreign keys
- Plan indexes
- Design RLS policies
```

### Step 3: Generate Migration
```
Use Supabase MCP to:
- Create migration file
- Write SQL for tables, functions, policies
- Add rollback logic
```

### Step 4: Apply Migration
```
- Test in local/dev environment
- Review migration SQL
- Apply to database
- Verify changes
```

### Step 5: Generate TypeScript Types
```
- Run Supabase type generation
- Create Zod schemas for validation
- Update API types
- Commit to GitHub
```

### Step 6: Create Data Access Layer
```
- Write Supabase queries
- Create React Query hooks
- Implement optimistic updates
- Add error handling
```

## Tool Router Integration

When designing tables for external integrations:
```sql
-- Store connection metadata
CREATE TABLE external_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users_profile(id),
  connection_id TEXT, -- Tool Router connection ID
  institution_name TEXT,
  account_type TEXT,
  last_synced TIMESTAMP,
  sync_status TEXT,
  metadata JSONB
);

-- Track sync history
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY,
  connection_id TEXT,
  synced_at TIMESTAMP,
  transactions_added INTEGER,
  status TEXT,
  error_message TEXT
);
```

## Output Format

Provide:
1. SQL migration file(s)
2. TypeScript type definitions
3. RLS policy documentation
4. Query examples
5. Performance considerations
6. Rollback instructions

## Example Usage

"Create a database schema for tracking recurring bills with reminders"

Expected output:
- Migration for `recurring_bills` table
- Trigger for automatic reminder creation
- RLS policies
- TypeScript types
- Query functions
