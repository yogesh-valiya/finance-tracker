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

The application will be accessible locally at `http://localhost:3000`.

### Manual Production Build

```bash
npm run build
npm run start -- -H 0.0.0.0 -p 3000
```

---

## Making the Application Accessible Over the Internet

When deploying to a remote server (such as an AWS EC2, DigitalOcean Droplet, Hetzner VPS, or a home server / homelab), follow these steps to securely expose your site to the public internet.

### 1. Prerequisite: Add Domain to Firebase Authorized Domains (CRITICAL)

Firebase Authentication blocks authentication requests (Google Sign-In, Email/Password) from origins that are not explicitly authorized:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (e.g., `super-trackerr`).
3. Navigate to **Build** > **Authentication** > **Settings** tab > **Authorized domains**.
4. Click **Add domain** and enter your public domain (e.g., `finance.yourdomain.com`), server IP (`123.45.67.89`), or tunnel hostname (`*.trycloudflare.com`).

> [!IMPORTANT]
> **HTTPS & Session Cookies:** When `NODE_ENV=production`, session cookies are marked `secure: true` (HTTP-only and HTTPS-only). Modern browsers will reject storing the session cookie over unencrypted HTTP on public IPs/domains. **Always terminate SSL (HTTPS)** using one of the reverse proxy or tunnel methods below.

---

### Option A: Cloudflare Tunnel (Recommended for Homelabs & Private Networks)

Cloudflare Tunnel (`cloudflared`) connects your server directly to Cloudflare without opening any firewall ports or port forwarding on your router. It provides free automatic HTTPS, DDoS protection, and works even behind Carrier-Grade NAT (CGNAT).

1. **Install `cloudflared` on your server:**
   ```bash
   # Debian / Ubuntu
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```

2. **Authenticate with your Cloudflare account:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create a tunnel:**
   ```bash
   cloudflared tunnel create finance-tracker
   ```

4. **Map your domain/subdomain:**
   ```bash
   cloudflared tunnel route dns finance-tracker finance.yourdomain.com
   ```

5. **Start routing traffic to port 3000:**
   ```bash
   cloudflared tunnel run --url http://localhost:3000 finance-tracker
   ```

6. *(Optional)* **Run as a background systemd service:**
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   sudo systemctl enable cloudflared
   ```

Now your site is accessible over HTTPS at `https://finance.yourdomain.com` with zero exposed router ports!

---

### Option B: Caddy Reverse Proxy (Easiest Automatic HTTPS on Cloud VPS)

If your server has a public static IP and you have pointed a DNS `A` record (`finance.yourdomain.com` -> `YOUR_SERVER_IP`), **Caddy** automatically provisions and renews Let's Encrypt SSL certificates with zero manual certbot commands.

1. **Install Caddy:**
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install caddy
   ```

2. **Edit `/etc/caddy/Caddyfile`:**
   ```caddy
   finance.yourdomain.com {
       reverse_proxy localhost:3000
   }
   ```

3. **Reload Caddy:**
   ```bash
   sudo systemctl reload caddy
   ```

---

### Option C: Nginx Reverse Proxy with Let's Encrypt (Industry Standard VPS)

For Ubuntu/Debian cloud servers running Nginx:

1. **Open Firewall Ports:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

2. **Install Nginx & Certbot:**
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. **Create Nginx Configuration (`/etc/nginx/sites-available/finance-tracker`):**
   ```nginx
   server {
       server_name finance.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable Site & Obtain SSL Certificate:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/finance-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d finance.yourdomain.com
   ```

---

### Option D: Direct Cloud Firewall / Security Group (Quick Access via IP)

If accessing directly via `http://<SERVER_IP>:3000` without a domain name (for internal networks or staging):

1. **Allow Port 3000 in your Cloud Provider's Security Group / Firewall:**
   - **AWS EC2:** Security Group -> Inbound rules -> Add rule -> Custom TCP, Port `3000`, Source `0.0.0.0/0` (or your personal IP).
   - **DigitalOcean / Hetzner / Linode:** Cloud Firewall -> Inbound rules -> TCP `3000`.
   - **Host Firewall (UFW):**
     ```bash
     sudo ufw allow 3000/tcp
     ```

2. **Important Note on Cookies for Direct HTTP:**
   If accessing via plain HTTP (`http://IP:3000`) rather than HTTPS, modern browsers won't save cookies marked `secure`. For production testing over plain HTTP, either run a reverse proxy with a self-signed certificate, or test via `localhost` SSH tunneling:
   ```bash
   # Forward remote server's port 3000 to your local machine:
   ssh -L 3000:localhost:3000 user@your-server-ip
   ```
   Then open `http://localhost:3000` in your local browser (browsers treat `localhost` as a secure origin).

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
