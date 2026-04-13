# PayFlow AI Backend

Express.js backend server for PayFlow AI - Invoice Management & Payment Processing System.

## Tech Stack

- **Framework**: Express.js 4.x
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Validation**: Zod
- **Code Quality**: ESLint, Prettier

## Project Structure

```
backend/
├── config/           # Configuration files (Supabase, etc.)
├── database/         # Database types, migrations, seeders
├── middleware/       # Express middleware (auth, error handling, logging)
├── routes/           # API route handlers
├── services/         # Business logic
├── scheduler/        # Cron jobs for reminders, notifications
├── utils/            # Utility functions
├── server.ts         # Express server setup
├── package.json      # Dependencies
└── tsconfig.json     # TypeScript configuration
```

## Installation

### Prerequisites

- Node.js 16+ or Bun
- npm, yarn, or bun package manager
- Supabase account

### Setup Steps

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**:
   Update `.env` with your:
   - Supabase credentials
   - JWT secret
   - Email service API keys
   - Payment gateway keys

5. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

6. **Seed database (optional)**:
   ```bash
   npm run db:seed
   ```

## Running the Server

### Development Mode

```bash
npm run dev
# Server runs on http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

All endpoints require JWT authentication (except `/auth` endpoints).

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Clients

- `POST /api/clients` - Create client
- `GET /api/clients` - List clients (paginated)
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/:id/statistics` - Get client statistics

### Invoices

- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - List invoices (paginated)
- `GET /api/invoices/stats/summary` - Get invoice statistics
- `GET /api/invoices/list/overdue` - Get overdue invoices
- `GET /api/invoices/list/upcoming` - Get upcoming due invoices
- `PUT /api/invoices/:id/status` - Update invoice status

### Payments

- `POST /api/payments` - Record payment
- `GET /api/payments` - List payments (paginated)
- `GET /api/payments/stats/summary` - Get payment statistics
- `GET /api/payments/invoices/:invoiceId` - Get invoice payments
- `DELETE /api/payments/:id` - Cancel payment

### Notifications

- `GET /api/notifications` - Get notifications (paginated)
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read/all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications` - Clear all notifications

### Analytics

- `POST /api/analytics/track` - Track event
- `GET /api/analytics` - Get analytics (date range required)
- `GET /api/analytics/summary` - Get event summary
- `GET /api/analytics/attribution` - Get user attribution

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Example:
```bash
curl -H "Authorization: Bearer eyJ..." http://localhost:3000/api/clients
```

## Services

### AuthService
Handles user registration, login, JWT management

### ClientService
Manages client CRUD operations and statistics

### InvoiceService
Creates and manages invoices, tracks status

### PaymentService
Records payments, validates amounts, updates invoice status

### NotificationService
Creates and manages user notifications

### AnalyticsService
Tracks user events for analytics dashboard

### EmailService
Sends transactional emails (invoices, reminders)

### SmsService
Sends SMS notifications via Twilio

## Database Schema

### Tables

- `users` - User accounts
- `clients` - Client information
- `invoices` - Invoice records
- `payments` - Payment records
- `notifications` - User notifications
- `analytics_events` - Event tracking

See [database/types.ts](./database/types.ts) for detailed schema.

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## Testing

Run tests with:

```bash
npm test              # Run tests
npm run test:coverage # Generate coverage report
```

## Deployment

### Environment Variables for Production

```
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
DATABASE_URL=<production-database-url>
JWT_SECRET=<strong-secret-key>
```

### Deploy to Vercel

```bash
vercel deploy
```

### Deploy to Heroku

```bash
heroku create payflow-ai-backend
git push heroku main
```

## Contributing

1. Create a feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "add feature"`
3. Push branch: `git push origin feature/name`
4. Open Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@payflowai.com
