# DevPulse Backend Server

Principal-grade Node.js Express API for the DevPulse infrastructure monitoring dashboard. Production-ready async/await architecture with real-time latency monitoring and incident tracking.

## Architecture

### Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.2+
- **Database**: MySQL 8.0+ with `mysql2/promise`
- **Pattern**: Async/await with connection pooling

### Core Features

#### 1. **GET /api/status** — System Status Endpoint

Returns real-time infrastructure metrics:

```json
{
  "services": [
    {
      "id": 1,
      "name": "API Gateway",
      "slug": "api-gateway",
      "status": "operational",
      "uptime": "99.99",
      "region": "US-East",
      "latencies": [45, 42, 48, ...]  // Last 20 samples
    }
  ],
  "incidents": [
    {
      "id": 1,
      "title": "Database Query Latency Spike",
      "description": "...",
      "severity": "warning",
      "timestamp": "2026-05-26T10:30:00Z",
      "duration": 1800000
    }
  ],
  "timestamp": "2026-05-26T12:00:00Z"
}
```

#### 2. **Background Latency Injection (Every 5 seconds)**

Automated cron job that:

- Queries all services from database
- Generates realistic latency based on service status:
  - **Operational**: 30-60ms
  - **Degraded**: 250-400ms
  - **Offline**: 5000ms (timeout simulation)
- Inserts into `latency_logs` table with timestamp

#### 3. **Frontend Serving**

Serves static frontend from `../Client` directory using `express.static()`

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- MySQL Server 8.0+

### Step 1: Install Dependencies

```bash
cd Server
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env` and update credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=devpulse
PORT=3000
```

### Step 3: Initialize Database

Import the schema to create tables and seed data:

```bash
mysql -u root -p < ../Database/schema.sql
```

Or login to MySQL and run:

```sql
SOURCE ../Database/schema.sql;
```

### Step 4: Start the Server

```bash
npm start
```

Expected output:

```
[STARTUP] ✓ MySQL connection pool initialized
[STARTUP] ✓ DevPulse API Server running on http://localhost:3000
[STARTUP] ✓ Serving frontend from: ../Client
[STARTUP] ✓ API endpoint: GET /api/status
[STARTUP] ✓ Starting background latency injection job (5s interval)
```

## Development

### Watch Mode (requires nodemon)

```bash
npm run dev
```

### Database Schema

#### `services` Table

| Column           | Type      | Notes                              |
| ---------------- | --------- | ---------------------------------- |
| `id`             | INT PK    | Auto-increment                     |
| `name`           | VARCHAR   | Service display name               |
| `slug`           | VARCHAR   | URL-safe identifier                |
| `current_status` | ENUM      | operational \| degraded \| offline |
| `created_at`     | TIMESTAMP | Creation timestamp                 |
| `updated_at`     | TIMESTAMP | Last update timestamp              |

#### `latency_logs` Table

| Column        | Type      | Notes                         |
| ------------- | --------- | ----------------------------- |
| `id`          | BIGINT PK | Auto-increment                |
| `service_id`  | INT FK    | References services.id        |
| `latency_ms`  | INT       | Response time in milliseconds |
| `recorded_at` | TIMESTAMP | When measurement was taken    |

#### `incidents` Table

| Column        | Type      | Notes                       |
| ------------- | --------- | --------------------------- |
| `id`          | INT PK    | Auto-increment              |
| `title`       | VARCHAR   | Incident title              |
| `description` | TEXT      | Detailed description        |
| `severity`    | ENUM      | info \| warning \| critical |
| `timestamp`   | TIMESTAMP | When incident occurred      |
| `duration`    | INT       | How long it lasted (ms)     |
| `created_at`  | TIMESTAMP | Record creation time        |

## API Documentation

### GET /api/status

**Description**: Fetch real-time system status, service metrics, and incident history

**Query Parameters**: None

**Response (200 OK)**:

```json
{
  "services": [...],
  "incidents": [...],
  "timestamp": "ISO8601"
}
```

**Response (500 Error)**:

```json
{
  "error": "Failed to fetch status data",
  "message": "Error details (dev only)"
}
```

**Performance**: ~50-150ms (depends on latency log volume)

## Configuration Options

### Environment Variables

```
PORT              Server port (default: 3000)
NODE_ENV          Environment mode (development, production)
DB_HOST           MySQL host (default: localhost)
DB_USER           MySQL user (default: root)
DB_PASSWORD       MySQL password (default: root)
DB_NAME           Database name (default: devpulse)
```

### Connection Pool Settings

Located in `server.js`:

- `connectionLimit`: 10 (concurrent connections)
- `waitForConnections`: true (queue requests if limit reached)
- `enableKeepAlive`: true (maintain persistent connections)

## Production Deployment

### Best Practices

1. **Environment**: Use PM2 or similar process manager
2. **Database**: Enable SSL connections with `ssl: true` in DB_CONFIG
3. **Monitoring**: Add winston/pino logging
4. **Caching**: Implement Redis for frequent /api/status calls
5. **Rate Limiting**: Add express-rate-limit middleware

### PM2 Deployment

```bash
npm install -g pm2
pm2 start server.js --name "devpulse-api" --instances 2
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
upstream devpulse {
    server localhost:3000;
    server localhost:3001;
}

server {
    listen 80;
    server_name api.devpulse.local;

    location / {
        proxy_pass http://devpulse;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Performance Metrics

### Typical Response Times

- `/api/status` with 5 services: ~80ms
- Background job interval: 5 seconds
- Latency log insertion: ~2ms per service

### Database Indexes

- Services: status, created_at
- Latency Logs: (service_id, recorded_at) composite
- Incidents: severity, timestamp

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**: Ensure MySQL is running

```bash
mysql -u root -p -e "SELECT 1"
```

### Access Denied

```
Error: ER_ACCESS_DENIED_FOR_USER 'root'@'localhost'
```

**Solution**: Update DB credentials in `.env`

### Undefined Table

```
Error: ER_NO_SUCH_TABLE 'devpulse.services'
```

**Solution**: Run database schema initialization

```bash
mysql -u root -p devpulse < ../Database/schema.sql
```

## License

ISC
