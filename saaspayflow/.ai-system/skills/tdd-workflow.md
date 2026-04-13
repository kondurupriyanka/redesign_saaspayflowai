---
name: tdd-workflow
description: Test-driven development workflow for PayFlow
---

# Test-Driven Development (TDD)

Write tests first, then code. All code must have ≥80% coverage.

## The TDD Cycle

1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve without changing behavior

```typescript
// ✅ Example: Testing invoice creation

// Step 1: RED - Write test that fails
describe('invoiceService.create', () => {
  it('should create invoice with valid data', async () => {
    const invoice = await invoiceService.create('user_123', {
      clientId: 'client_456',
      amount: 1500,
      dueAt: new Date('2024-02-15'),
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.number).toBe('INV-001');
    expect(invoice.status).toBe('draft');
  });
});
// Test fails: invoiceService.create doesn't exist yet

// Step 2: GREEN - Write minimal code
export const invoiceService = {
  async create(userId: string, data: CreateInvoiceInput) {
    const lastInvoice = await db.invoices.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const number = 'INV-001'; // Minimal: hardcoded

    const invoice = await db.invoices.create({
      userId,
      ...data,
      number,
      status: 'draft',
      createdAt: new Date(),
    });

    return invoice;
  },
};
// Test passes

// Step 3: REFACTOR - Make it proper
export const invoiceService = {
  async create(userId: string, data: CreateInvoiceInput) {
    // Validate user owns client
    const client = await clientService.get(userId, data.clientId);
    if (!client) throw new UnauthorizedError();

    // Generate invoice number
    const lastInvoice = await db.invoices.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    const nextNumber = generateInvoiceNumber(lastInvoice?.number);

    const invoice = await db.invoices.create({
      userId,
      ...data,
      number: nextNumber,
      status: 'draft',
      createdAt: new Date(),
    });

    // Log activity
    await activityService.log(userId, 'invoice_created', 'invoice', invoice.id);

    return invoice;
  },
};
```

## Unit Tests (Functions)

```typescript
// ✅ Test business logic in isolation
describe('generateInvoiceNumber', () => {
  it('should increment number correctly', () => {
    expect(generateInvoiceNumber('INV-001')).toBe('INV-002');
    expect(generateInvoiceNumber('INV-999')).toBe('INV-1000');
    expect(generateInvoiceNumber(null)).toBe('INV-001');
  });

  it('should handle edge cases', () => {
    expect(generateInvoiceNumber('')).toBe('INV-001');
    expect(generateInvoiceNumber('INVALID')).toThrow();
  });
});

describe('calculateOverdueDays', () => {
  it('should return 0 if not overdue', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
    expect(calculateOverdueDays(future)).toBe(0);
  });

  it('should calculate correct days overdue', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5); // 5 days ago
    expect(calculateOverdueDays(past)).toBe(5);
  });
});
```

## Integration Tests (APIs)

```typescript
// ✅ Test API endpoints with database
describe('POST /api/invoices', () => {
  beforeEach(async () => {
    // Create test user and client
    testUser = await db.users.create({ email: 'test@example.com' });
    testClient = await db.clients.create({
      userId: testUser.id,
      name: 'Test Client',
    });
  });

  afterEach(async () => {
    // Clean up
    await db.invoices.deleteMany({ userId: testUser.id });
    await db.clients.deleteMany({ userId: testUser.id });
    await db.users.delete(testUser.id);
  });

  it('should create invoice and return 201', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${getToken(testUser.id)}`)
      .send({
        clientId: testClient.id,
        amount: 1500,
        dueAt: new Date('2024-02-15'),
      });

    expect(response.status).toBe(201);
    expect(response.body.data.number).toBe('INV-001');

    // Verify in database
    const created = await db.invoices.findUnique(response.body.data.id);
    expect(created.userId).toBe(testUser.id);
  });

  it('should return 400 if amount is invalid', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${getToken(testUser.id)}`)
      .send({ clientId: testClient.id, amount: -100 });

    expect(response.status).toBe(400);
  });

  it('should return 401 if not authenticated', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .send({ clientId: testClient.id, amount: 1500 });

    expect(response.status).toBe(401);
  });
});
```

## Component Tests (React)

```typescript
// ✅ Test components with React Testing Library
describe('<InvoiceForm />', () => {
  it('should submit form with valid data', async () => {
    const handleSubmit = vi.fn();
    render(<InvoiceForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText('Amount'), '1500');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1500 })
    );
  });

  it('should show validation errors', async () => {
    render(<InvoiceForm onSubmit={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
  });
});
```

## E2E Tests (User Flows)

```typescript
// ✅ Test entire user journeys with Playwright
describe('Invoice creation flow', () => {
  it('user can create and send invoice', async ({ page }) => {
    // Login
    await page.goto('https://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Create invoice
    await page.click('text=New Invoice');
    await page.fill('input[name="clientName"]', 'Acme Inc');
    await page.fill('input[name="amount"]', '1500');
    await page.click('button:has-text("Create")');

    // Verify created
    expect(await page.isVisible('text=INV-001')).toBeTruthy();

    // Send invoice
    await page.click('button:has-text("Send")');
    await page.waitForSelector('text=Invoice sent');
  });
});
```

## Coverage Requirements

- **All business logic**: 100% coverage
- **All API routes**: 100% coverage
- **Components**: ≥80% coverage
- **E2E critical paths**: All user flows

Run checks:

```bash
npm run test                    # Run all tests
npm run test -- --coverage     # Show coverage report
npm run test -- --watch        # Watch mode for development
```

## When to Skip Tests

Only in these cases:

- 3rd-party library code (trust the library)
- Auto-generated code
- Trivial getters/setters

Everything else: **test it**.
