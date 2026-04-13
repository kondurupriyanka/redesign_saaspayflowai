---
name: auth-patterns
description: Authentication and authorization patterns with OAuth2, JWT
---

# Authentication & Authorization

Secure auth patterns for PayFlow using OAuth2 and JWT.

## OAuth2 with Supabase (Recommended)

```typescript
// ✅ Enable Google OAuth in Supabase dashboard
// Then use Supabase client for auth

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Sign in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourdomain.com/auth/callback',
  },
});

// Callback handler
export async function handleAuthCallback(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;

  // User automatically created in users table via trigger
  return data.session;
}
```

## JWT Tokens

```typescript
// ✅ Storage (use httpOnly cookies, never localStorage)
// Supabase handles JWT issuance automatically

// Middleware to verify token
const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = await supabase.auth.getUser(token);
    req.user = decoded.data.user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.use(verifyAuth);
```

## Role-Based Access Control (RBAC)

```typescript
// ✅ Define roles and permissions
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer', // Read-only
}

// Store role in user metadata
const updateUserRole = async (userId: string, role: Role) => {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  });
};

// Check role in middleware
const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.user_metadata?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage
app.delete(
  '/api/invoices/:id',
  verifyAuth,
  requireRole(Role.ADMIN, Role.USER),
  invoiceController.delete
);
```

## Data Ownership Checks

```typescript
// ✅ Always verify user owns the resource
async function getInvoice(userId: string, invoiceId: string) {
  const invoice = await db.invoices.findUnique({
    where: { id: invoiceId },
  });

  // Verify user owns invoice
  if (invoice.user_id !== userId) {
    throw new UnauthorizedError('Cannot access invoice');
  }

  return invoice;
}

// In controller
router.get('/api/invoices/:id', verifyAuth, async (req, res) => {
  const invoice = await getInvoice(req.user.id, req.params.id);
  res.json(invoice);
});
```

## Session Management

```typescript
// ✅ Use httpOnly cookies for session
// Supabase handles this automatically with refresh tokens

const loginHandler = async (req, res) => {
  const { user, session } = await supabase.auth.signInWithPassword({
    email: req.body.email,
    password: req.body.password,
  });

  // Set httpOnly cookie (Supabase does this)
  res.cookie('access_token', session.access_token, {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: 'lax',
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  });

  res.cookie('refresh_token', session.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ success: true });
};

// ✅ Refresh token rotation
const refreshHandler = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  // Set new tokens
  res.cookie('access_token', data.session.access_token, { httpOnly: true, secure: true });
  res.cookie('refresh_token', data.session.refresh_token, { httpOnly: true, secure: true });

  res.json({ success: true });
};
```

## Multi-Tenancy (Optional)

```typescript
// ✅ If future teams/workspaces needed
const middleware = async (req, res, next) => {
  const { user } = req;
  const workspace = req.headers['x-workspace-id'];

  // Verify user has access to workspace
  const access = await db.workspaceMembers.findUnique({
    where: {
      user_id_workspace_id: { user_id: user.id, workspace_id: workspace },
    },
  });

  if (!access) throw new UnauthorizedError();

  req.workspace = workspace;
  req.userRole = access.role;
  next();
};
```

## Security Best Practices

- ✅ Always verify user owns data (row-level security)
- ✅ Use HTTPS in production
- ✅ Set httpOnly, sameSite on cookies
- ✅ Implement rate limiting on auth endpoints
- ✅ Log suspicious activity
- ❌ Never store passwords in plain text
- ❌ Never send sensitive data in URL query params
- ❌ Never log auth tokens
