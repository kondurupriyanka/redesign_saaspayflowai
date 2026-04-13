---
name: database-patterns
description: Supabase/PostgreSQL schema and migration patterns
---

# Database Patterns

Schema design and query patterns for PayFlow with Supabase/PostgreSQL.

## Schema Design

```sql
-- ✅ Users table (auth via Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name) -- Prevent duplicate client names per user
);

-- ✅ Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  number TEXT NOT NULL, -- INV-001, INV-002, etc.
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, paid, overdue, cancelled
  issued_at DATE,
  due_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  UNIQUE(user_id, number) -- Invoice numbers unique per user
);

-- ✅ Payments table (for payment history, not PCI data)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  paddle_transaction_id TEXT NOT NULL UNIQUE, -- Reference to Paddle
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  payment_method TEXT, -- card, bank_transfer, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  INDEX (invoice_id),
  INDEX (paddle_transaction_id)
);

-- ✅ Activity log (audit trail)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'invoice_created', 'payment_received', 'invoice_sent'
  entity_type TEXT, -- 'invoice', 'payment', 'client'
  entity_id UUID,
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX (user_id, created_at) -- For audit queries
);

-- ✅ Create indexes for performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_at ON invoices(due_at);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
```

## Migrations

```typescript
// ✅ Using Drizzle ORM
import { drizzle } from 'drizzle-orm/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const db = drizzle(supabase);

// ✅ Run migrations
db.run(sql`CREATE TABLE ...`);
```

## Common Queries

```typescript
// ✅ List user's invoices with status
const invoices = await db
  .select()
  .from(invoicesTable)
  .where(eq(invoicesTable.userId, userId))
  .orderBy(desc(invoicesTable.createdAt))
  .limit(20)
  .offset((page - 1) * 20);

// ✅ Get invoice with client and payments
const invoiceDetail = await db
  .select()
  .from(invoicesTable)
  .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
  .leftJoin(paymentsTable, eq(invoicesTable.id, paymentsTable.invoiceId))
  .where(eq(invoicesTable.id, invoiceId));

// ✅ Calculate overdue invoices
const overdueInvoices = await db
  .select()
  .from(invoicesTable)
  .where(
    and(
      eq(invoicesTable.userId, userId),
      lt(invoicesTable.dueAt, new Date()),
      notIn(invoicesTable.status, ['paid', 'cancelled'])
    )
  );

// ✅ Upsert with conflict handling
const client = await db
  .insert(clientsTable)
  .values({ userId, name, email })
  .onConflictDoUpdate({
    target: [clientsTable.userId, clientsTable.name],
    set: { email, updatedAt: new Date() },
  })
  .returning();
```

## Row-Level Security (RLS)

```sql
-- ✅ Users can only see their own data
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
```

## Performance

- **N+1 queries**: Always eagerly load related data (LEFT JOIN)
- **Pagination**: Always limit + offset
- **Filtering**: Use indexes on status, dates, user_id
- **Sorting**: Index on (user_id, created_at) for common queries
