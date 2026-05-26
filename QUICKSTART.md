# DevPulse Backend Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites Check

```bash
# Verify Node.js
node --version  # Should be 18+

# Verify MySQL
mysql --version  # Should be 8.0+
mysql -u root -p -e "SELECT 1"  # Test connection
```

### Installation Steps

**1. Install Dependencies**

```bash
cd Server
npm install
```

**2. Setup Database**

```bash
# Create database and tables
mysql -u root -p < ../Database/schema.sql

# Verify tables
mysql -u root -p devpulse -e "SHOW TABLES;"
```

**3. Configure Environment**

```bash
# Copy template
cp .env.example .env

# Edit .env with your MySQL credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=<your_password>
# DB_NAME=devpulse
```

**4. Start Server**

```bash
npm start
```

**5. Test API**

```bash
# In a new terminal
curl http://localhost:3000/api/status
```

---

## 📊 What's Happening

### Backend Architecture

```
┌─────────────────────────────┐
│   Express Server (3000)     │
├─────────────────────────────┤
│ GET /api/status             │
│ └─ Queries services table   │
│ └─ Stitches latency samples │
│ └─ Fetches incidents        │
│ └─ Returns JSON payload     │
├─────────────────────────────┤
│ Background Cron (5s loop)   │
│ └─ Generates latencies      │
│ └─ Inserts into DB          │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│   MySQL Database            │
├─────────────────────────────┤
│ services                    │
│ latency_logs                │
│ incidents                   │
└─────────────────────────────┘
```

### Real-Time Latency Injection

Every 5 seconds, the background job:

1. Fetches all services from `services` table
2. Generates realistic latency based on `current_status`:
   - **operational** → 30-60ms
   - **degraded** → 250-400ms
   - **offline** → 5000ms
3. Inserts record into `latency_logs` with current timestamp

### API Response Structure

```json
{
  "services": [
    {
      "id": 1,
      "name": "API Gateway",
      "status": "operational",
      "latencies": [45, 42, 48, ...]  // Last 20 samples
    }
  ],
  "incidents": [
    {
      "title": "Database Spike",
      "severity": "warning",
      "timestamp": "..."
    }
  ]
}
```

---

## 🔧 Common Tasks

### View Database

```bash
mysql -u root -p devpulse

# List services
SELECT * FROM services;

# View recent latencies
SELECT service_id, latency_ms, recorded_at
FROM latency_logs
ORDER BY recorded_at DESC
LIMIT 10;

# View incidents
SELECT * FROM incidents ORDER BY timestamp DESC;
```

### Insert Test Data

```sql
-- Add a new service
INSERT INTO services (name, slug, current_status)
VALUES ('Storage Service', 'storage', 'operational');

-- Add an incident
INSERT INTO incidents (title, description, severity)
VALUES ('API Rate Limit Hit', 'Traffic spike event', 'warning');
```

### Monitor Cron Logs

```bash
# Watch for latency insertions (look for [CRON] logs)
npm start 2>&1 | grep CRON
```

### Change Update Frequency

Edit `server.js` line `// Start background latency injection job`:

```javascript
setInterval(startLatencySimulation, 5000); // Change 5000 to desired ms
```

---

## 🐛 Troubleshooting

| Issue                               | Solution                                                         |
| ----------------------------------- | ---------------------------------------------------------------- |
| `Cannot find module 'mysql2'`       | Run `npm install`                                                |
| `Connection refused`                | Ensure MySQL service is running                                  |
| `Access denied`                     | Check `.env` credentials                                         |
| `No such table`                     | Run database schema: `mysql -u root -p < ../Database/schema.sql` |
| `Server starts but no API response` | Check database connection in logs                                |

---

## 📈 Next Steps

1. **Production Deployment**: See README.md for PM2/Nginx setup
2. **Frontend Integration**: Frontend at `../Client` auto-served on `/`
3. **Performance Optimization**: Add Redis caching for `/api/status`
4. **Monitoring**: Add Winston logging middleware
5. **Authentication**: Implement API key or JWT validation

---

## 📝 File Structure

```
Server/
├── server.js           # Main Express API
├── package.json        # Dependencies
├── .env                # Configuration (local)
├── .env.example        # Template
└── README.md           # Full documentation

Database/
└── schema.sql          # MySQL tables & seed data

Client/
└── (Frontend files)    # Auto-served by express.static()
```

---

**Questions?** Check `Server/README.md` for detailed documentation.
