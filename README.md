# Sniplly — URL Shortener with Analytics

> **Shorten. Track. Dominate.**  
> A full-stack, production-ready URL shortener with real-time click analytics, custom slugs, and a premium dark-themed dashboard.

**Live demo:** [sniplly.vercel.app](https://sniplly.vercel.app)  
**Backend API:** [url-shortener-551x.onrender.com](https://url-shortener-551x.onrender.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Architecture Decisions](#architecture-decisions)

---

## Overview

Sniplly is a URL shortening service built for people who care about performance and data. It resolves short links in under 100ms, tracks every click with device/browser/country breakdowns, and presents the data in a clean analytics dashboard.

The project was built in phases following a detailed PRD:

| Phase | Scope |
|-------|-------|
| 1 | Project scaffolding, TypeScript config, DB models |
| 2 | Authentication (register / login / JWT) |
| 3 | Link management (create, list, deactivate, delete, expiry) |
| 4 | Click analytics (queue, geo-lookup, aggregation) |
| 5 | React frontend (landing, auth, dashboard, analytics) |

---

## Features

- **Sub-100ms redirects** — slug resolution served directly from MongoDB with indexed queries
- **Custom slugs** — pick your own alias or let the system generate a 6-character nanoid
- **Link expiry** — set an optional expiry date; expired links return 410 Gone
- **Click analytics** — total clicks, unique clicks, clicks over time (30 days), country breakdown, device breakdown, browser breakdown
- **Queue-backed tracking** — click events are processed asynchronously via Bull/Redis; gracefully falls back to direct DB writes when Redis is unavailable
- **JWT authentication** — stateless auth with `localStorage` token persistence and Axios interceptors
- **Dark-themed dashboard** — `surface-900` palette, Recharts area chart, stat cards, paginated link table
- **SPA routing** — Vercel rewrite config for seamless React Router navigation on refresh

---

## Tech Stack

### Backend

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JSON Web Tokens (`jsonwebtoken` + `bcryptjs`) |
| Validation | Zod |
| Queue | Bull (Redis) |
| Logging | Pino + pino-http |
| Error monitoring | Sentry (`@sentry/node`) |
| Geo-lookup | ipapi.co |
| User-agent parsing | ua-parser-js |
| Testing | Jest + ts-jest + Supertest |

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Animation | Framer Motion |
| HTTP client | Axios |
| Server state | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Space Grotesk (logo), Inter (body) |

---

## Project Structure

```
URL Shortner/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express app (CORS, middleware, routes)
│   │   ├── server.ts               # Process entry: DB connect, listen, graceful shutdown
│   │   ├── config/
│   │   │   ├── database.ts         # Mongoose connection
│   │   │   ├── env.ts              # Zod-validated environment config
│   │   │   ├── logger.ts           # Pino logger instance
│   │   │   └── sentry.ts           # Sentry initialisation
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── linkController.ts
│   │   │   ├── analyticsController.ts
│   │   │   └── redirectController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── linkService.ts
│   │   │   ├── analyticsService.ts
│   │   │   ├── geoService.ts       # ipapi.co geo-lookup
│   │   │   └── slugGenerator.ts    # Nanoid-based slug generation
│   │   ├── repositories/
│   │   │   ├── linkRepository.ts
│   │   │   └── clickRepository.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Link.ts
│   │   │   └── Click.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts     # JWT verify middleware
│   │   │   ├── errorHandler.ts
│   │   │   └── requestLogger.ts
│   │   ├── queues/
│   │   │   └── clickQueue.ts       # Bull queue; falls back to direct write if Redis down
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── linkRoutes.ts
│   │   │   └── redirectRoutes.ts
│   │   ├── utils/
│   │   │   └── asyncHandler.ts
│   │   └── __tests__/
│   │       ├── setup.ts
│   │       ├── integration/
│   │       │   ├── links.test.ts
│   │       │   └── redirect.test.ts
│   │       └── unit/
│   │           ├── authService.test.ts
│   │           ├── linkService.test.ts
│   │           ├── analyticsService.test.ts
│   │           └── slugGenerator.test.ts
│   ├── .env.example
│   ├── jest.config.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── public/
    │   └── logo.jpg
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx                 # Router, QueryClient, AuthProvider
    │   ├── styles/
    │   │   └── index.css           # Tailwind v4 + custom design tokens
    │   ├── types/
    │   │   └── index.ts            # Shared TypeScript interfaces
    │   ├── lib/
    │   │   └── cn.ts               # clsx + tailwind-merge helper
    │   ├── services/
    │   │   ├── api.ts              # Axios instance + JWT interceptors
    │   │   ├── authApi.ts
    │   │   └── linksApi.ts
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useLinks.ts
    │   │   └── useAnalytics.ts
    │   ├── components/
    │   │   ├── ui/                 # Button, Input, Card, Badge, Modal, Logo
    │   │   ├── layout/             # Navbar, Footer, Sidebar, DashboardLayout, AuthLayout
    │   │   └── features/
    │   │       └── links/          # LinkTable, CreateLinkModal
    │   └── pages/
    │       ├── Landing.tsx
    │       ├── Login.tsx
    │       ├── Register.tsx
    │       ├── Dashboard.tsx
    │       ├── Analytics.tsx
    │       └── NotFound.tsx
    ├── .env.production
    ├── vercel.json
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier works fine)
- **Redis** *(optional)* — used for the click queue; the server falls back to direct DB writes if Redis is unavailable

---

### Backend Setup

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Install dependencies (including devDependencies for TypeScript compilation)
npm install --include=dev

# 3. Copy the example env file and fill in your values
cp .env.example .env

# 4. Start the development server (ts-node-dev with hot reload)
npm run dev
```

The API will be available at `http://localhost:5000`.

To build and run in production mode:

```bash
npm run build      # compiles TypeScript → dist/
npm start          # runs dist/server.js
```

---

### Frontend Setup

```bash
# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

In development, Vite proxies all `/api` requests to `http://localhost:5000` — no extra configuration needed.

To build for production:

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## Environment Variables

### Backend — `backend/.env`

Copy `backend/.env.example` and fill in the values:

```env
# Application
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Database (required)
MONGODB_URI=mongodb://localhost:27017/url-shortener

# Auth (required — minimum 32 characters)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars

# Queue (optional — server degrades gracefully without Redis)
REDIS_URL=redis://localhost:6379

# Monitoring (optional — leave empty to disable)
SENTRY_DSN=

# Geo-lookup (optional — leave empty to skip country tracking)
IPAPI_KEY=
```

### Frontend — `frontend/.env.production`

Used only during the production Vite build:

```env
# Full URL to the backend API (include /api)
VITE_API_URL=https://your-backend.onrender.com/api

# Base URL used to display short links
VITE_SHORT_BASE=https://your-backend.onrender.com
```

In development these are not needed — the Vite proxy handles API calls automatically.

---

## API Reference

All authenticated endpoints require the header:

```
Authorization: Bearer <token>
```

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Returns `{ status, timestamp, environment }` |

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Create a new account. Body: `{ name, email, password }` |
| `POST` | `/api/auth/login` | No | Login. Body: `{ email, password }`. Returns `{ token, user }` |
| `GET` | `/api/auth/me` | Yes | Returns the authenticated user's profile |

### Links — `/api/links`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/links/` | Optional | Create a short link. Body: `{ originalUrl, customSlug? }` |
| `GET` | `/api/links/` | Yes | List all links for the authenticated user (paginated) |
| `GET` | `/api/links/:id` | Yes | Get a single link by ID |
| `GET` | `/api/links/:id/analytics` | Yes | Get analytics for a link |
| `PATCH` | `/api/links/:id/deactivate` | Yes | Deactivate a link |
| `PATCH` | `/api/links/:id/expiry` | Yes | Update link expiry date. Body: `{ expiresAt }` |
| `DELETE` | `/api/links/:id` | Yes | Delete a link permanently |

### Redirect

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/:slug` | No | Resolves the slug and 302-redirects to the original URL. Records a click event in the background. |

---

## Running Tests

Tests live entirely in the backend. The test environment bootstraps its own env variables — no `.env` file required.

```bash
cd backend

# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

Test suites:

| Suite | Type | File |
|-------|------|------|
| Auth service | Unit | `unit/authService.test.ts` |
| Link service | Unit | `unit/linkService.test.ts` |
| Analytics service | Unit | `unit/analyticsService.test.ts` |
| Slug generator | Unit | `unit/slugGenerator.test.ts` |
| Links API | Integration | `integration/links.test.ts` |
| Redirect | Integration | `integration/redirect.test.ts` |

---

## Deployment

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com) pointing to the `backend/` directory.
2. Set **Build Command:** `npm install --include=dev && npm run build`
3. Set **Start Command:** `npm start`
4. Add the following environment variables in the Render dashboard:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | A long random secret |
   | `FRONTEND_URL` | `https://sniplly.vercel.app` (no trailing slash) |
   | `BASE_URL` | Your Render service URL |

### Frontend — Vercel

1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add the environment variable `VITE_API_URL` pointing to your Render backend URL + `/api`.
4. The `frontend/vercel.json` rewrite rule handles SPA routing automatically — no extra configuration needed.

---

## Architecture Decisions

**Optional Redis / graceful degradation**  
The click queue uses Bull backed by Redis. If Redis is unavailable (common in free-tier environments), the server logs a warning and writes click events directly to MongoDB. This prevents crashes and keeps the core redirect functionality intact.

**Zod for env validation**  
All environment variables are parsed and validated by Zod at startup. Missing required values throw a descriptive error immediately — no silent runtime failures.

**Repository pattern**  
Database access is separated into repository classes (`linkRepository`, `clickRepository`). This keeps service logic clean and makes it straightforward to mock DB calls in unit tests.

**React Query for server state**  
All API interactions use TanStack React Query. Mutations automatically invalidate relevant caches, keeping the dashboard in sync without manual state management.

**Axios interceptors**  
A single Axios instance handles JWT injection on every request and automatically redirects to `/login` on 401 responses, ensuring the auth flow is consistent across the entire frontend.

---

## Author

**Oluwatobi Showale** — [@Thatguyy-Jt](https://github.com/Thatguyy-Jt)
