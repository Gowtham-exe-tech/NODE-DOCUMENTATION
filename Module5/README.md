# Module 3 - Authentication Practice

This is the first ~60% of the Advanced Authentication, Security & RBAC practice project.

## Completed

- Express application setup
- JSON request parsing
- User registration
- bcrypt password hashing
- Duplicate email check
- Default `user` role
- Login
- bcrypt password verification
- JWT access-token creation
- JWT expiration
- JWT authentication middleware
- `req.user` payload attachment
- Basic reusable RBAC middleware
- Protected `GET /api/v1/products`

## Not completed yet

- Helmet
- CORS
- Rate limiting
- Admin user creation/seed
- Admin-only product deletion
- Full product CRUD
- More advanced validation
- Refresh tokens
- Persistent database

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set a strong JWT secret.

```bash
npm run dev
```

Server:

```text
http://localhost:3000
```

## API

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Gowtham",
  "email": "gowtham@example.com",
  "password": "StrongPassword@123"
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "gowtham@example.com",
  "password": "StrongPassword@123"
}
```

The response contains an `accessToken`.

### Get Products

```http
GET /api/v1/products
Authorization: Bearer <accessToken>
```

A valid JWT is required.

## Current Flow

```text
Register
  ↓
Validate input
  ↓
bcrypt.hash()
  ↓
Store passwordHash
  ↓
Create user with role=user
```

```text
Login
  ↓
Find user
  ↓
bcrypt.compare()
  ↓
jwt.sign()
  ↓
Return accessToken
```

```text
Protected request
  ↓
Authorization header
  ↓
authenticateToken
  ↓
jwt.verify()
  ↓
req.user
  ↓
Route handler
```

## Naming

camelCase is used for JavaScript variables and functions:

```js
passwordHash
accessToken
existingUser
isPasswordValid
authenticateToken
createAccessToken
requiredRole
```
