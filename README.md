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

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default `3000`) |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_NAME` | PostgreSQL connection |
| `JWT_ACCESS_TOKEN_SECRET` / `JWT_REFRESH_TOKEN_SECRET` | JWT signing secrets |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (e.g. `30s`, `1d`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outgoing email (e.g. verification/reset links) |
| `FRONTEND_URL` | URL of the deployed/local client, used for CORS |

### 2. Client

```bash
cd client
npm install
cp .env.example .env   # fill in real values
npm run dev
```

Required environment variables (see `client/.env.example`):

| Variable | Description |
|---|---|
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
