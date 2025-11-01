---
skill: design-to-code
dependencies:
  - figma (via Rube MCP)
  - v0 (via Rube MCP)
description: Convert Figma designs to production-ready code for finance app components
tags: [design, frontend, ui, components]
---

# Design-to-Code Workflow

Transform Figma designs into production-ready React/Next.js components for the finance app.

## What this skill does

1. **Fetch Figma designs** - Retrieve design files, components, and styles from Figma
2. **Generate component code** - Use V0 to generate React components from designs
3. **Apply finance-specific patterns** - Ensure components follow financial data display best practices
4. **Integrate with Supabase** - Connect components to backend data models

## When to use this skill

- Converting dashboard layouts to code
- Creating expense/income entry forms
- Building transaction history components
- Designing spending analysis charts
- Implementing budget tracking UI

## Workflow Steps

### Step 1: Fetch Figma Design
```
Request the Figma file URL or component ID from the user if not provided.
Use Figma MCP to:
- Retrieve design specs (colors, typography, spacing)
- Export component frames
- Get design tokens and variables
```

### Step 2: Analyze Design Requirements
```
Identify:
- Component structure (forms, tables, charts)
- Data requirements (API endpoints, Supabase tables)
- Interactive elements (filters, date pickers, category selectors)
- Responsive breakpoints
- Accessibility requirements
```

### Step 3: Generate Code with V0
```
Use V0 via Rube MCP to:
- Generate base component structure
- Create Tailwind/CSS styling
- Implement responsive layouts
- Add form validation patterns
```

### Step 4: Finance-Specific Enhancements
```
Add:
- Currency formatting (internationalization support)
- Number formatting with proper decimal handling
- Date/time formatting for transactions
- Chart integrations (recharts, chart.js)
- Real-time updates for balance displays
- Loading states for financial calculations
```

### Step 5: Supabase Integration
```
- Define TypeScript types from Supabase schema
- Create data fetching hooks
- Implement real-time subscriptions for live updates
- Add optimistic UI updates for mutations
- Handle error states and loading indicators
```

### Step 6: Validation & Testing
```
Ensure:
- Proper error handling for financial data
- Input validation (amounts, dates, categories)
- Edge cases (negative balances, decimal precision)
- Accessibility (ARIA labels, keyboard navigation)
- Mobile responsiveness
```

## Finance App Specific Patterns

### Transaction Display Component
- Show amount with proper sign (+/-)
- Color coding (green for income, red for expenses)
- Category icons
- Date formatting
- Payment method indicators

### Dashboard Cards
- Real-time balance updates
- Period comparisons (month-over-month)
- Trend indicators (up/down arrows)
- Quick action buttons

### Input Forms
- Amount input with currency symbol
- Category dropdown/autocomplete
- Date picker with presets (today, yesterday)
- Note/description field
- Receipt attachment option

### Charts & Analytics
- Spending by category (pie/donut chart)
- Income vs expenses timeline (line/bar chart)
- Budget progress bars
- Monthly comparison views

## Tool Router Integration Notes

When the component needs to connect to external financial services (banks, payment processors):
- Design the component to trigger Tool Router authentication flow
- Display connection status
- Show loading states during external API calls
- Handle authentication errors gracefully
- Provide retry mechanisms

## Output Format

Provide:
1. Complete component code with TypeScript types
2. Supabase query/mutation functions
3. Styling (Tailwind classes or CSS modules)
4. Usage example with sample data
5. Props documentation
6. Any required dependencies to install

## Example Usage

"Convert the expense entry form from Figma frame 'Expense-Form-V2' to a Next.js component with Supabase integration"

Expected output:
- `ExpenseForm.tsx` component
- `useExpenses.ts` hook for data operations
- Type definitions
- Validation schema (zod/yup)
- Integration with Tool Router for receipt scanning
