# Finance Tracker — Bookkeeping & Net Worth Web Application

A modern, high-density personal finance and wealth management platform built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma ORM, and PostgreSQL. Designed for speed, precision, and deep financial clarity across desktop and mobile devices.

---

## Key Features

- **Double-Entry Ledger & Accurate Transfers:** Strict double-entry invariants ensuring source and destination account balances remain mathematically consistent without partial updates.
- **Financial Precision (`decimal.js`):** Absolute decimal precision without floating-point arithmetic pitfalls for monetary calculations.
- **Unified Analytics & Proportional Breakdown (`/stats`):**
  - Interactive Donut Chart with percentage weights and double-click category filtering.
  - Granularity-aware Trend Charts supporting **Monthly** (daily buckets 1–31), **Annually** (12 months), **Weekly** (days of the week), and **Custom Date Ranges**.
  - Multi-line subcategory breakdown toggle (`[ Total | By Subcategory ]`) displaying distinct trend lines with legends and tooltips.
  - Ranked Categories Accordion with thumb-friendly buttons and tree-aligned subcategory branches.
  - Itemized transaction records with instant click-to-edit modal and sort order dropdown (`Newest First`, `Oldest First`, `Price: High to Low`, `Price: Low to High`).
- **Accounts & Net Worth Management (`/accounts`):**
  - Account groupings: Cash, Bank Accounts, Credit Cards, Investments, Loans, and Savings.
  - Net Worth tracking with dynamic asset/liability split and historical growth charts.
- **Fast Transaction Management:**
  - Quick-entry dialog with auto-focus, keyboard navigation, category selector, fee tracking, and recurrence settings.
- **Recurring Transactions & Schedules:** Flexible rules (Daily, Weekdays, Weekly, Monthly, Annually) with automatic execution and preview.
- **Authentication & Security:** Firebase Authentication with secure server-side session cookies (`firebase-admin`) and strict user data isolation.
- **Responsive & PWA Ready:** Mobile safe-area inset support, thumb-friendly actions, and desktop data-dense views.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Standalone output) |
| **Language** | TypeScript 5 (Strict mode) |
| **Frontend** | React 19, Tailwind CSS v4, Base UI primitives |
| **UI Components** | shadcn/ui design system, Lucide Icons |
| **Charts & Visuals** | Recharts |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma ORM 6 |
| **Financial Math** | Decimal.js |
| **Authentication** | Firebase Auth (Client) + Firebase Admin SDK (Server) |
| **Containerization**| Docker & Docker Compose |

---

## Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker & Docker Compose** (recommended for running PostgreSQL locally)
- A **Firebase Project** (for client authentication and admin verification)

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd finance-tracker-2
npm install
```

### 2. Environment Configuration

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

Configure the environment variables in `.env`:

```env
# Database Connection (Local or Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/financetracker?schema=public"

# Firebase Client Configuration (from Firebase Console > Project Settings > General)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Firebase Admin SDK Credentials (from Firebase Console > Service Accounts)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Session Encryption Secret
SESSION_SECRET="generate-a-secure-random-string-here"
```

> **Tip:** You can generate a strong `SESSION_SECRET` with:
> ```bash
> openssl rand -base64 32
> ```

---

### 3. Database Setup

#### Option A: Using Docker for PostgreSQL (Recommended)

Start the PostgreSQL database container:

```bash
docker compose up -d db
```

Verify that the database container is healthy:

```bash
docker compose ps
```

#### Option B: Using an Existing PostgreSQL Instance

If you are running PostgreSQL directly on your machine or cloud provider, ensure the `DATABASE_URL` in `.env` points to your PostgreSQL database.

#### Push the Schema & Generate Prisma Client

Sync the database schema and generate Prisma types:

```bash
npx prisma db push
npx prisma generate
```

---

### 4. Seed Realistic Demo Data (6 Months)

The project includes an intelligent seeding script that populates 6 months (March – August 2026) of authentic income, living expenses, investments, and transfers with 150+ realistic transactions per month:

```bash
# Seed transactions for all users in database:
npm run seed:transactions

# Or target a specific user and reset their existing transactions:
npx tsx scripts/seed-6months.ts test2@gmail.com --clean
```

---

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Sign in or create a user account via Firebase Authentication.
- Navigate to `/stats` to view the unified Analytics dashboard, trend graphs, and itemized records.
- Navigate to `/accounts` for account balances and net worth performance.
- Navigate to `/transactions` for full transaction log with search and filters.

---

## Production & Docker Deployment

### Self-Hosted via Docker Compose

To build and run both the Next.js standalone container and PostgreSQL in production mode:

```bash
docker compose up --build -d
```

The application will be accessible at `http://localhost:3000`.

### Manual Production Build

```bash
npm run build
npm run start
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server on `http://localhost:3000` |
| `npm run build` | Compiles the production build (Next.js standalone output) |
| `npm run start` | Starts the Next.js production server |
| `npm run lint` | Runs ESLint across the codebase |
| `npm run seed:transactions` | Seeds 6 months of realistic transactions for existing users |
| `npx prisma studio` | Opens Prisma Studio GUI at `http://localhost:5555` to browse the database |
| `npx prisma db push` | Pushes the Prisma schema state directly to the database |

---

## Project Structure

```
finance-tracker-2/
├── prisma/
│   └── schema.prisma              # PostgreSQL relational data model & enums
├── public/                        # Static assets, icons, manifest
├── scripts/
│   └── seed-6months.ts            # Realistic 6-month financial data seeder
├── src/
│   ├── app/
│   │   ├── (app)/                 # Protected application routes
│   │   │   ├── accounts/          # Accounts & Net worth management
│   │   │   ├── more/              # Settings, categories, recurring rules
│   │   │   ├── stats/             # Unified Spending & Income Analytics
│   │   │   └── transactions/      # Paginated transaction feed
│   │   ├── api/                   # Server Route Handlers
│   │   │   ├── accounts/          # Account CRUD & balance calculations
│   │   │   ├── analytics/         # Granularity-aware trend & category breakdown
│   │   │   ├── auth/              # Firebase session cookie authentication
│   │   │   ├── categories/        # Categories & subcategories
│   │   │   └── transactions/      # Transaction operations with ledger invariants
│   │   ├── auth/                  # Login, registration, forgot password pages
│   │   ├── layout.tsx             # Root layout with ThemeProvider & AuthProvider
│   │   └── page.tsx               # Root redirect / landing logic
│   ├── components/
│   │   ├── accounts/              # Account cards, forms, net worth performance chart
│   │   ├── analytics/             # DonutChart, TrendChart (with multi-line series)
│   │   ├── transaction/           # TransactionFormDialog, category selector
│   │   └── ui/                    # shadcn/ui components (Select, Popover, Card, Button...)
│   └── lib/
│       ├── auth/                  # Firebase Admin session verification & client auth
│       ├── decimal.ts             # Deterministic financial math utilities
│       ├── prisma.ts              # PrismaClient singleton instance
│       └── utils.ts               # Class merging (cn) and formatting helpers
├── docker-compose.yml             # Docker Compose for PostgreSQL and Next.js app
├── Dockerfile                     # Multi-stage standalone Next.js container build
└── package.json                   # Project dependencies and run scripts
```

---

## Architectural Principles

1. **User Scoping & Isolation:** Every query and mutation is strictly scoped to the authenticated Firebase UID resolved on the server side.
2. **Financial Precision:** Currency arithmetic is calculated using exact decimal representations via `decimal.js` or Prisma `Decimal` fields to eliminate IEEE 754 floating-point inaccuracies.
3. **shadcn-First UI Standards:** Built exclusively with composable, accessible shadcn/ui components and design tokens.
4. **Data Density:** Visual layouts prioritize information density, rapid comparison, and clean hierarchical scanning.
