# Enterprise Hotel & Restaurant Management System (HRMS)
## System Specifications & Production Documentation Manual

Comprehensive handbook detailing backend configurations, API documentation, schema seeds, structures, and deployment pipelines.

---

### 1. Unified Folder Structure

```text
/
├── data/                    # High-fidelity Relational files database
│   └── database.json        # Preseeded JSON database store (No-SQL RDBMS simulator)
├── src/
│   ├── backend/
│   │   └── db.ts            # Core database file adapter + Seed data generator
│   ├── components/          # Modularized functional front-end subviews
│   │   ├── DashboardView.tsx # KPI blocks & analytical charts (Recharts)
│   │   ├── RoomsView.tsx     # Rooms inventory CRUD overlays & selectors
│   │   ├── CustomersView.tsx # Guests directory indexing & profile models
│   │   ├── BookingsView.tsx  # Interactive room stays reservations & checkers
│   │   ├── RestaurantView.tsx# Hospitality diner card menu inventories
│   │   ├── OrderingView.tsx  # Dynamic Cart checklists & tray dispatch modules
│   │   ├── BillingView.tsx   # Itemized invoice reviews + Native Print triggers
│   │   └── ReportsView.tsx   # Dedicated corporate performance printable audits
│   ├── types.ts             # Shared unified Type contracts
│   ├── App.tsx              # Coordinator (JWT sessions, layout matrices, Axios routers)
│   ├── main.tsx             # Application initialization mountpoint
│   └── index.css            # Tailwind and space typeface imports
├── package.json             # Scripts & bundle manifest
├── tsconfig.json            # Strict TypeScript rules bounds
├── schema.sql               # Production-grade MySQL schemas scripts (keys, cascaded drops, constraints)
└── server.ts                # Express backend REST routers & Vite client adapters
```

---

### 2. Live API Routes & Endpoints Reference

All routing is prefixed with `/api/*` and protected by standard JWT Bearer Authorization signatures where appropriate.

#### A. Authentication Security
* **`POST /api/auth/login`**
  * **Payload:** `{ "username": "admin", "password": "admin123" }`
  * **Return:** `{ "token": "JWT_TOKEN...", "user": { "id", "username", "role", "customerId?" } }`

#### B. Dashboard Analytics
* **`GET /api/dashboard/stats`** (Auth Required)
  * Returns active inventory KPIs (total rooms, available counts, billing yields, daily dining receipts).
* **`GET /api/dashboard/reports`** (Auth Required)
  * Returns structured Recharts dataset segments (10-day trends, monthly cycles, occupancy ratios, dishes top sales).

#### C. Room Management
* **`GET /api/rooms`** (Public/Auth) - Query parameters: `search?`, `type?`, `status?`
* **`POST /api/rooms`** (Auth Admin Only) - Appends new suite records.
* **`PUT /api/rooms/:id`** (Auth Admin Only) - Modifies room configurations.
* **`DELETE /api/rooms/:id`** (Auth Admin Only) - Drops suite if safe (unoccupied constraint).

#### D. Customer Profiles
* **`GET /api/customers`** (Auth) - Access directories.
* **`POST /api/customers`** (Auth Admin Only) - Registers new guests files (provisions login user).
* **`PUT /api/customers/:id`** (Auth Required) - Modifies phone, email, addresses.
* **`DELETE /api/customers/:id`** (Auth Admin Only) - Cascades delete user records.

#### E. Room Bookings
* **`GET /api/bookings`** (Auth) - Pulls client-linked bookings or global logs.
* **`POST /api/bookings`** (Auth Required) - Inspects dates overlaps, estimates rentals, reserves room.
* **`PUT /api/bookings/:id/status`** (Auth Required) - Triggers check-in, checkout, or cancellation. Checkout auto-aggregates a new Bill Statement invoice!

#### F. Restaurant Culinary
* **`GET /api/food-items`** (Public) - Catalog lookup.
* **`POST /api/food-items`** (Auth Admin Only) - Adds meal recipes.
* **`PUT /api/food-items/:id`** (Auth Admin Only) - Changes pricing/stock levels.
* **`DELETE /api/food-items/:id`** (Auth Admin Only) - Deletes food item.

#### G. Room Service Orders
* **`GET /api/food-orders`** (Auth) - Dining order queues.
* **`POST /api/food-orders`** (Auth Required) - Submits meal lists.
* **`PUT /api/food-orders/:id/status`** (Auth Required) - Sets delivery markers (Pending, Served, Cancelled).

#### H. Billing Invoices
* **`GET /api/bills`** (Auth) - Pulls invoice log histories.
* **`PUT /api/bills/:id/pay`** (Auth Admin Only) - Clears invoice and logs paid balances.

---

### 3. Setup Instructions (Running Locally)

Follow these directions to prepare and launch the platform:

#### Step 3.1: Install Dependencies
Ensure you have Node.js 18+ installed on your developer machine:
```bash
npm install
```

#### Step 3.2: Database Preparation (MySQL Setup)
1. Initialize a local MySQL Server instance.
2. Log into the shell and execute our schema SQL script:
```bash
mysql -u root -p < schema.sql
```

#### Step 3.3: Environment Setup
Create a `.env` configuration file in the project root:
```env
JWT_SECRET="your_secure_development_key"
PORT=3000
NODE_ENV="development"
```

#### Step 3.4: Launch Dev Servers
Boot the Express + Vite unified system simultaneously:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser.

---

### 4. Production Build & Deployment Map

To compile the system into a single production bundle for deployment:

#### Step 4.1: Perform Production Compile
```bash
npm run build
```
This builds:
1. Static compiled client assets, outputted to `/dist/`.
2. Fully bundled Express Node binary compiling to `/dist/server.cjs` using lightweight `esbuild`.

#### Step 4.2: Launch standalone executable Node server
```bash
npm run start
```
This launches a lightning-fast, self-contained server on port 3000 that serves static assets and routing proxy endpoints automatically.

---

### 5. Preseeded Credentials Catalog

To log in and test immediate capabilities:

* **Admin Access:**
  * **Username:** `admin`
  * **Password:** `admin123`
* **Guest Access:**
  * **Username:** `customer_john`
  * **Password:** `john123`
