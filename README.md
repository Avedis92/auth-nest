# auth_nest

A simple authentication and authorization app, split into two parts:

- **server/** — NestJS + PostgreSQL API (JWT access/refresh tokens, email via SMTP)
- **client/** — React + Vite + MUI frontend

## Project structure

```
auth_nest/
├── client/   # React (Vite) frontend
└── server/   # NestJS backend
```

## Local development

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # fill in real values
npm run start:dev
```

Required environment variables (see `server/.env.example`):

| Variable                                                                                    | Description                                     |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `PORT`                                                                                      | Port the API listens on (default `3000`)        |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_NAME` | PostgreSQL connection                           |
| `JWT_ACCESS_TOKEN_SECRET` / `JWT_REFRESH_TOKEN_SECRET`                                      | JWT signing secrets                             |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN`                                          | Token lifetimes (e.g. `30s`, `1d`)              |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`                                       | Outgoing email (e.g. verification/reset links)  |
| `FRONTEND_URL`                                                                              | URL of the deployed/local client, used for CORS |

### Database schema

The server uses raw SQL (`pg`) against PostgreSQL, so the schema below must be created manually before running the app:

```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE session_status AS ENUM ('active', 'logged_out');
CREATE TYPE session_sign_in_method AS ENUM ('email_and_password', 'oauth');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(300) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    disabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret TEXT,
    is_user_registered_for_two_factor BOOLEAN NOT NULL DEFAULT false,
    is_two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status session_status NOT NULL DEFAULT 'active',
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    sign_in_method session_sign_in_method NOT NULL DEFAULT 'email_and_password'
);

CREATE TABLE reset_tokens (
    token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ
);

CREATE TABLE identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    UNIQUE (provider, provider_id)
);
```

`identities` links a user to an external oAuth provider account (e.g. Google) — `provider` is the provider name (`google`) and `provider_id` is that provider's unique subject/user id (`sub`). A user signs in via oAuth by matching on `(provider, provider_id)`; if no identity exists, one is created and linked to a `users` row (existing or newly created).

`gen_random_uuid()` requires the `pgcrypto` extension (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) on PostgreSQL versions before 13, or `uuid-ossp` as an alternative — PostgreSQL 13+ has `gen_random_uuid()` built in.

`users.disable` marks an account as disabled by an admin. A disabled user fails login with a 403 ("This account has been disabled. Contact an administrator.") and has all of their active sessions revoked at the moment they're disabled, so any refresh tokens already issued stop working immediately instead of staying valid until they expire.

### Admin dashboard: paginated, searchable user list

`GET /api/v1/admin/users` (admin/super-admin only) powers the admin dashboard's user table. It supports `limit` (default `10`, max `100`), `offset` (default `0`), and an optional `search` query param that does a case-insensitive partial match (`ILIKE`) against `email`. Results are ordered by `created_at DESC`. The response includes a `pagination` block (`total`, `limit`, `offset`, `totalPages`) so the client can render page controls without a separate count request. Regular admins never see super-admin accounts in the list — only a requester with the `super_admin` role gets those rows included.

Each row in the response also carries session info — `lastSignInDate`, `lastSignOutDate`, and `activeSessionsCount` — sourced from an in-memory session cache (`SessionService`) rather than the `sessions` table. This is a deliberate shortcut for this demo project: instead of running a per-user aggregate query against `sessions` for every page of the dashboard, the API does one batched in-memory lookup (`getBatchUsersInfo`) keyed by user id. In a production system this cache would be backed by something like Redis (so it survives restarts and is shared across instances) rather than a plain `Map` in process memory.

### 2. Client

```bash
cd client
npm install
cp .env.example .env   # fill in real values
npm run dev
```

Required environment variables (see `client/.env.example`):

| Variable       | Description                |
| -------------- | -------------------------- |
| `VITE_API_URL` | Base URL of the server API |

## Deployment

### Server → Render / Railway (or similar)

- Build command: `npm run build`
- Start command: `npm run start:prod`
- Set all server environment variables listed above, with `FRONTEND_URL` pointing at the deployed client URL.

### Client → Vercel / Netlify (or similar)

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed server URL.

After deploying, update the server's `FRONTEND_URL` env var and the client's `VITE_API_URL` env var to point at each other's live URLs, then redeploy the server so CORS allows the deployed client's origin.
