---
name: deployment-patterns
description: Deployment to Vercel, Docker, and CI/CD patterns
---

# Deployment Patterns

Deploy PayFlow to production safely and reliably.

## Vercel (Frontend + API Routes)

```bash
# ✅ Deploy Next.js to Vercel
npm install -g vercel
vercel                  # Interactive setup

# Environment variables
vercel env add NEXT_PUBLIC_API_URL https://api.example.com
vercel env add DATABASE_URL postgres://...
vercel env add PADDLE_API_KEY ...
```

## Environment Variables

```env
# .env.local (development - never commit)
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgres://user:pass@localhost:5432/payflow
JWT_SECRET=your-secret-key-here

# Vercel (set via dashboard)
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.payflow.com
DATABASE_URL=postgres://...
JWT_SECRET=production-secret
PADDLE_API_KEY=...
```

## Docker (Optional, for self-hosted backend)

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

```bash
# Build and run
docker build -t payflow-api .
docker run -p 3000:3000 payflow-api
```

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Database Migrations

```bash
# ✅ Run migrations before deploy
npm run migrate:latest

# ✅ Verify migrations
npm run migrate:status
```

## Health Checks

```typescript
// ✅ Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    version: process.env.APP_VERSION,
    uptime: process.uptime(),
  });
});

// Use in Vercel to monitor deployments
```

## Rollback Strategy

```bash
# ✅ If deployment breaks, rollback via Vercel CLI
vercel rollback             # Rollback to previous version
vercel promote <deployment> # Promote old deployment to production
```

## Monitoring

```typescript
// ✅ Log errors to external service
import { captureException } from '@sentry/node';

app.use((err, req, res, next) => {
  captureException(err, {
    tags: { endpoint: req.path },
    user: { id: req.user?.id },
  });

  res.status(500).json({ error: 'Internal Server Error' });
});
```

## Pre-Deploy Checklist

- [ ] All tests passing
- [ ] No console.log() statements
- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] No secrets in code
- [ ] API endpoints tested
- [ ] E2E tests pass
- [ ] Health check endpoint working
