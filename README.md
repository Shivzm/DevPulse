# ⚡ DevPulse // Enterprise System Status Index

[![Architecture](https://img.shields.io/badge/Architecture-Monolithic_Decoupled-00ffa3?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-Node.js_|_Express_|_MySQL-blue?style=flat-square)](#)
[![UX](https://img.shields.io/badge/UX-Vanilla_JS_|_Custom_Physics-purple?style=flat-square)](#)

> DevPulse is a high-performance, ultra-luxury micro-SaaS infrastructure status monitoring dashboard. It provides engineering teams and end-users with real-time telemetry, incident tracking, and system health metrics.

---

## The Problem

During critical infrastructure degradation or outages, communication breaks down.

1. **Support Flooding** — Users flood support channels with duplicate tickets because they lack visibility into system status.
2. **Loss of Trust** — Opaque or delayed communication during downtime severely damages brand trust and user confidence.
3. **Bloated Alternatives** — Existing status page solutions are heavily bloated, requiring massive client-side frameworks, or are prohibitively expensive for lean engineering teams.

---

## The Solution

DevPulse acts as the **single source of truth** during operational incidents. It is a centralized, real-time dashboard that captures continuous performance metrics from core services and displays them inside an ultra-dark, glassmorphic UI.

By providing immediate, clear visual indicators of system health — **Operational**, **Degraded**, **Critical** — DevPulse bridges the communication gap between DevOps teams and end-users.

---

## Architecture Philosophy

DevPulse is intentionally built using a **lightweight monolithic architecture**.

In an era of heavy client-side frameworks (React, Vue, Angular), DevPulse strips away the bloat in favor of raw vanilla JavaScript paint-performance and custom hardware-accelerated CSS physics.

**Why?** Because a status page must be the most resilient page on the internet. If your primary infrastructure is failing, your status page must load instantly — even on 3G networks. Every chart, scroll reveal, screen transition, and text animation in DevPulse is computed on the user's GPU using pure CSS bezier physics and native browser APIs.

---

## Business Advantages

| Advantage | Description |
|---|---|
| 📉 **Deflects Support Volume** | Proactive communication immediately reduces inbound support tickets during an incident |
| 💎 **Preserves Brand Equity** | A premium, flawlessly animated UI reassures users that professionals are actively monitoring |
| ⚡ **Zero-Dependency Frontend** | Sub-millisecond layout engine paint times — accessible when users need it most |
| 📋 **Internal Accountability** | Historical incident archive creates a transparent log for SLAs and post-mortem reviews |

---

## Technical Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla Semantic HTML5, Modular CSS (Hardware-Accelerated `@keyframes`), ES6+ JavaScript (Intersection Observer API, Event Delegation) |
| **Backend** | Node.js, Express Framework (Async routing, isolated pipeline modules, native static asset delivery) |
| **Database** | MySQL (Relational schema with structural cascading foreign keys and sequential logging) |

---

## Repository Structure

```text
devpulse-project/
│
├── database/
│   └── schema.sql              # Core database structural builds & seed records
│
├── backend/                    # Monolithic Express API runtime
│   ├── server.js               # Express core routing & telemetry polling threads
│   ├── package.json            # Application dependencies
│   └── .env                    # System environment keys (database configuration)
│
└── Client/                     # Static production asset directory (case-sensitive)
    ├── index.html              # Central structural DOM entrance file
    ├── style.css               # Luxury theme stylesheets & timing matrices
    └── app.js                  # Dynamic SPA routers & SVG vector builders
```

---

## Quickstart & Local Deployment

Follow these steps to deploy DevPulse locally using an integrated Apache/MySQL development server (e.g., XAMPP).

### 1. Database Initialization

1. Launch your local database server **(XAMPP → Start Apache & MySQL)**
2. Open your database management tool at [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
3. Select the **SQL** tab
4. Execute the script located at `/database/schema.sql` to build the `devpulse` database, tables, and seed data

### 2. Environment Configuration

Navigate to `/backend` and configure your `.env` file:

```env
PORT=3000
NODE_ENV=development

# MySQL Local Connection Values
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=                   # Leave blank for default XAMPP
DB_NAME=devpulse

# Admin Security Configuration
ADMIN_KEY=devpulse_master_2026
```

### 3. Engine Boot Sequence

Open a terminal inside the `/backend` directory and run:

```bash
# Install required dependencies
npm install express mysql2 dotenv

# Initialize the primary monitoring server pipeline
node server.js
```

Upon successful initialization, the console will output:

```
[DB] ✓ MySQL connection pool initialized
[STARTUP] Starting background latency injection job (5s interval)
[STARTUP] ✓ DevPulse API Server running on http://localhost:3000
[STARTUP] ✓ Serving frontend from: ../Client
```

### 4. System Access

Open any modern browser and navigate to:

```
http://localhost:3000
```

---

*DevPulse — Infrastructure transparency, engineered for resilience.*