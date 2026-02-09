# Task Manager API

A RESTful API for managing tasks and users, built with Node.js and Express. Supports user registration, JWT-based authentication (including Google OAuth), full task CRUD with bulk operations, and a role-protected analytics dashboard.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (HTTP-only cookies), Google OAuth
- **Validation**: Joi
- **Testing**: Jest, Supertest
- **Security**: Helmet, express-rate-limit, express-xss-sanitizer
- **Docs**: Swagger / OpenAPI (`swagger.yaml`)

## How to Run Locally

**Prerequisites**: Node.js, PostgreSQL installed and running.

```bash
git clone `https://github.com/Kremifany/node-homework`
cd node-homework
npm install
```

Set up the PostgreSQL databases:

```sql
CREATE DATABASE tasklist;
CREATE DATABASE testtasklist;
```

Run Prisma migrations and start the server:

```bash
npx prisma migrate dev
npm run dev
```

The server runs on `http://localhost:3000`. Verify with `GET /health`.

Run tests:

```bash
npm test
```

## Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://<user>:<password>@localhost/tasklist
TEST_DATABASE_URL=postgresql://<user>:<password>@localhost/testtasklist
JWT_SECRET=<your-jwt-secret>
RECAPTCHA_SECRET=<your-recaptcha-secret-key>
RECAPTCHA_BYPASS=<bypass-token-for-testing>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=<your-google-redirect-uri>
NODE_ENV=development
```

## Authentication Overview

- **Register** (`POST /api/users/register`) - Creates account with hashed password (`crypto.scrypt`), returns JWT cookie + CSRF token. reCAPTCHA required.
- **Login** (`POST /api/users/logon`) - Validates credentials, sets JWT in HTTP-only cookie.
- **Google OAuth** (`POST /api/users/googleLogon`) - Exchanges Google auth code for token; auto-creates account for new users.
- **Logoff** (`POST /api/users/logoff`) - Clears JWT cookie.

All authenticated routes require the JWT cookie. All mutating requests (`POST`, `PATCH`, `DELETE`) also require an `X-CSRF-TOKEN` header.

## Extra Features

- **Bulk Operations** - Create, update, or delete multiple tasks in a single request with filter support (by IDs, priority, completion status)
- **Google OAuth** - Full sign-in with Google using authorization code flow, with automatic account creation
- **Role-Based Access Control** - `manager` role required for analytics endpoints; roles stored per-user and checked via middleware
- **Analytics Dashboard** (`/api/analytics`) - User stats with task counts, weekly progress tracking, and cross-user task search with relevance ranking (raw SQL)
- **Welcome Tasks** - New users receive 3 starter tasks created atomically via Prisma transactions
- **Pagination & Search** - All list endpoints support `page`, `limit`, `find` (case-insensitive), and `fields` selection
- **Security Hardening** - Rate limiting (100 req/15min), Helmet headers, XSS sanitization, 1kb request size limit
- **Graceful Shutdown** - Proper handling of `SIGINT`, `SIGTERM`, uncaught exceptions
- **Health Check** (`GET /health`) - Returns server and database connection status
- **Swagger Docs** - Interactive API documentation at [`/api-docs`](http://localhost:3000/api-docs)

## Deployed Backend

[https://node-homework-fany.onrender.com](https://node-homework-fany.onrender.com)

## License

Copyright (c) 2025 Code the Dream
This project is licensed under the MIT License -- see the [LICENSE](./LICENSE) file for details.
