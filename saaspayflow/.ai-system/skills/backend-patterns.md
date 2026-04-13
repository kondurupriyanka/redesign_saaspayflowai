---
name: backend-patterns
description: Node.js/Express API patterns for PayFlow
---

# Backend Patterns

Best practices for Express.js/Node.js TypeScript APIs in PayFlow.

## Route Structure

```typescript
// ✅ Clean, layered architecture
// src/routes/invoices.ts
import { Router } from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { auth, validate } from '../middleware';
import { createInvoiceSchema } from '../schemas';

const router = Router();

router.get('/', auth, invoiceController.list);           // GET /api/invoices
router.post('/', auth, validate(createInvoiceSchema), invoiceController.create);
router.get('/:id', auth, invoiceController.get);
router.put('/:id', auth, validate(createInvoiceSchema), invoiceController.update);
router.delete('/:id', auth, invoiceController.delete);

export default router;
```

## Controller Pattern

```typescript
// ✅ Controllers handle HTTP, delegate business logic to services
export const invoiceController = {
  async list(req, res, next) {
    try {
      const invoices = await invoiceService.listByUser(req.user.id);
      res.json(invoices);
    } catch (error) {
      next(error); // Centralized error handling
    }
  },

  async create(req, res, next) {
    try {
      const invoice = await invoiceService.create(req.user.id, req.body);
      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  },
};
```

## Service Layer (Business Logic)

```typescript
// ✅ Services contain all business logic, not controllers
export const invoiceService = {
  async create(userId: string, data: CreateInvoiceInput): Promise<Invoice> {
    // Validate user owns the client
    const client = await clientService.get(userId, data.clientId);
    if (!client) throw new UnauthorizedError('Client not found');

    // Create invoice
    const invoice = await db.invoices.create({
      ...data,
      userId,
      status: 'draft',
      createdAt: new Date(),
    });

    return invoice;
  },

  async send(userId: string, invoiceId: string): Promise<void> {
    const invoice = await db.invoices.findById(invoiceId);
    if (invoice.userId !== userId) throw new UnauthorizedError();
    if (invoice.status !== 'draft') throw new BadRequestError('Can only send drafts');

    // Send email
    await emailService.send({
      to: invoice.client.email,
      subject: `Invoice ${invoice.number}`,
      html: renderTemplate('invoice', { invoice }),
    });

    // Update status
    await db.invoices.update(invoiceId, { status: 'sent', sentAt: new Date() });
  },
};
```

## Middleware Chain

```typescript
// ✅ Compose middleware in entry point
import express from 'express';
import { errorHandler, auth, requestLogger } from './middleware';
import invoiceRoutes from './routes/invoices';

const app = express();

// Global middleware
app.use(express.json());
app.use(requestLogger);

// API routes
app.use('/api/invoices', auth, invoiceRoutes);
app.use('/api/clients', auth, clientRoutes);
app.use('/api/payments', auth, paymentRoutes);

// Error handling (MUST be last)
app.use(errorHandler);

app.listen(3000);
```

## Error Handling

```typescript
// ✅ Custom error classes
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// ✅ Centralized error handler middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  // Log critical errors
  if (statusCode >= 500) {
    logger.error({ err, req });
  }

  res.status(statusCode).json({
    error: { message, code },
  });
};
```

## Authentication

```typescript
// ✅ JWT-based auth with refresh tokens
const auth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new UnauthorizedError('No token');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
};

// Sign tokens
const signToken = (userId: string, expiresIn = '1h') => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn });
};
```

## Database Queries

```typescript
// ✅ Use parameterized queries (always)
const invoice = await db.query(
  'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
  [invoiceId, userId]
);

// ✅ With ORM (Prisma, Drizzle)
const invoice = await db.invoice.findUnique({
  where: { id: invoiceId },
  include: { client: true, lineItems: true }, // Eager load relations
});
```

## Patterns to Avoid

- ❌ Logic in routes — use services
- ❌ Inconsistent error handling — use middleware
- ❌ Exposing database errors to clients
- ❌ Synchronous operations that block — always async
- ❌ Returning sensitive data (passwords, API keys)
