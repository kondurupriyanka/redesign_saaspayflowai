---
name: api-design
description: REST API design principles for PayFlow endpoints
---

# API Design

RESTful API standards for PayFlow backends.

## HTTP Semantics

| Method | Meaning | Idempotent | Response |
|--------|---------|-----------|----------|
| GET | Retrieve resource | Yes | 200 OK / 404 Not Found |
| POST | Create resource | No | 201 Created |
| PUT | Replace resource | Yes | 200 OK / 204 No Content |
| PATCH | Partial update | Yes | 200 OK |
| DELETE | Remove resource | Yes | 204 No Content / 200 OK |

## Response Format

```json
// ✅ Success response
HTTP/1.1 200 OK
{
  "data": {
    "id": "inv_123",
    "number": "INV-001",
    "amount": 1500,
    "status": "sent",
    "clientId": "client_456",
    "dueDate": "2024-02-15"
  }
}

// ✅ Error response
HTTP/1.1 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid amount",
    "details": [
      { "field": "amount", "message": "Must be greater than 0" }
    ]
  }
}

// ✅ List with pagination
HTTP/1.1 200 OK
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "hasMore": true
  }
}
```

## Endpoints

```
GET    /api/invoices                 List all invoices (paginated)
GET    /api/invoices/:id             Get invoice detail
POST   /api/invoices                 Create invoice
PUT    /api/invoices/:id             Update invoice
DELETE /api/invoices/:id             Delete invoice

POST   /api/invoices/:id/send        Send invoice (action endpoint)
POST   /api/invoices/:id/reminder    Send reminder (action endpoint)

GET    /api/invoices/:id/payments    Get payments for invoice
```

## Query Parameters

```
GET /api/invoices?page=1&limit=20&status=sent&sort=-createdAt

# Filtering: ?status=sent,draft
# Pagination: ?page=1&limit=20
# Sorting: ?sort=-createdAt (desc), ?sort=amount (asc)
# Fields: ?fields=id,number,amount (optional sparse fields)
```

## Authentication

```
Authorization: Bearer <jwt_token>

// All requests must include token in Authorization header
// 401 Unauthorized if missing
// 403 Forbidden if user lacks permission
```

## Status Codes

- **200 OK**: Request succeeded, returning data
- **201 Created**: Resource created (POST)
- **204 No Content**: Request succeeded, no data (DELETE)
- **400 Bad Request**: Validation error or malformed request
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but lacks permission
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Operation conflicts with current state
- **422 Unprocessable Entity**: Semantic error (e.g., can't send already-sent invoice)
- **429 Too Many Requests**: Rate limited
- **500 Internal Server Error**: Server error

## Versioning

```
/api/v1/invoices     (current version)
/api/v2/invoices     (future major version)

// Prefer URL versioning for clarity
// Maintain backward compatibility for ≥2 versions
```

## Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890

// 100 requests per hour per user
// Return 429 when limit exceeded
```

## Field Naming

```typescript
// ✅ Use camelCase in JSON
{
  "invoiceId": "...",
  "clientName": "...",
  "lineItems": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "isPaid": false
}

// ✅ Use ISO 8601 for timestamps
"createdAt": "2024-01-15T10:30:00Z"
"dueDate": "2024-02-15"
```

## Idempotency

For non-idempotent operations (POST), support idempotency keys:

```
POST /api/invoices
Idempotency-Key: unique-key-123

// If retry with same key, return cached response
```
