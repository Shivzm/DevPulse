/**
 * DevPulse Backend Server
 * Principal Production-Grade Node.js Express API
 * Real-time Infrastructure Status & Monitoring Dashboard
 */

const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ===== Configuration =====
const PORT = process.env.PORT || 3000;
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: "",
  database: process.env.DB_NAME || "devpulse",
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
};

const app = express();

// ===== Middleware =====
app.use(express.json());
app.use(express.static(path.join(__dirname, "../Client")));

// Global database connection pool
let db = null;

// ===== Utility: Generate Realistic Latency =====
/**
 * Generates realistic latency based on service status
 * @param {string} status - Service status: 'operational', 'degraded', 'offline'
 * @returns {number} Latency in milliseconds
 */
function generateLatency(status) {
  const generators = {
    operational: () => 30 + Math.floor(Math.random() * 31), // 30-60ms
    degraded: () => 250 + Math.floor(Math.random() * 151), // 250-400ms
    offline: () => (Math.random() > 0.5 ? 5000 : null), // Timeout or very high
  };

  const latency = (generators[status] || generators.operational)();
  return latency || 5000;
}

// ===== API: Get System Status =====
/**
 * GET /api/status
 * Returns all services with their latest 20 latency samples and incident history
 */
app.get("/api/status", async (req, res) => {
  try {
    // Fetch all services
    const [services] = await db.query(
      "SELECT id, name, slug, current_status FROM services",
    );

    // Fetch all incidents sorted by newest first
    const [incidents] = await db.query(
      "SELECT id, title, description, severity, timestamp, duration FROM incidents ORDER BY timestamp DESC",
    );

    // Stitch latest 20 latency logs to each service
    const servicesWithMetrics = await Promise.all(
      services.map(async (service) => {
        const [latencies] = await db.query(
          `SELECT latency_ms FROM latency_logs 
                     WHERE service_id = ? 
                     ORDER BY recorded_at DESC 
                     LIMIT 20`,
          [service.id],
        );

        // Calculate average latency
        const avgLatency =
          latencies.length > 0
            ? Math.round(
                latencies.reduce((sum, log) => sum + log.latency_ms, 0) /
                  latencies.length,
              )
            : 0;

        return {
          id: service.id,
          name: service.name,
          slug: service.slug,
          status: service.current_status,
          uptime: "99.99",
          region: "US-East",
          latencies: latencies.map((log) => log.latency_ms).reverse(),
        };
      }),
    );

    // Transform incidents to match frontend schema
    const formattedIncidents = incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity || "info",
      timestamp: incident.timestamp,
      duration: incident.duration || null,
    }));

    res.json({
      services: servicesWithMetrics,
      incidents: formattedIncidents,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] /api/status error:", error);
    res.status(500).json({
      error: "Failed to fetch status data",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ===== API: Admin Authentication =====
app.post("/api/admin/login", (req, res) => {
  const { key } = req.body;
  const masterKey = process.env.ADMIN_KEY || "fallback_secret";

  if (key === masterKey) {
    // In a massive production app, we would return a JWT token here.
    // For this lightweight SPA, a success flag is perfectly fine.
    res.json({ success: true, message: "Authentication successful." });
  } else {
    // HTTP 401 means "Unauthorized"
    res.status(401).json({ success: false, error: "Invalid authorization key." });
  }
});

// ===== Background Job: Mock Latency Injection =====
/**
 * Every 5 seconds, insert realistic latency data for each service
 * Simulates continuous monitoring/polling of services
 */
async function startLatencySimulation() {
  if (!db) return;

  try {
    const [services] = await db.query(
      "SELECT id, current_status FROM services",
    );

    for (const service of services) {
      try {
        const latency = generateLatency(service.current_status);

        await db.query(
          `INSERT INTO latency_logs (service_id, latency_ms, recorded_at) 
                     VALUES (?, ?, NOW())`,
          [service.id, latency],
        );
      } catch (error) {
        console.error(
          `[CRON] Failed to insert latency for service ${service.id}:`,
          error.message,
        );
      }
    }

    console.log(
      `[CRON] Latency injection completed for ${services.length} services`,
    );
  } catch (error) {
    console.error("[CRON] Background job failed:", error.message);
  }
}

// ===== Database Connection Handler =====
/**
 * Initialize database connection pool
 */
async function initializeDatabase() {
  try {
    db = await mysql.createPool(DB_CONFIG);

    // Test connection
    const connection = await db.getConnection();
    console.log("[DB] ✓ MySQL connection pool initialized");
    connection.release();

    return true;
  } catch (error) {
    console.error("[DB] ✗ Connection failed:", error.message);
    return false;
  }
}

// ===== Server Startup =====
/**
 * Initialize and start the Express server
 */
async function startServer() {
  try {
    // Connect to database
    const dbConnected = await initializeDatabase();
    if (!dbConnected) {
      console.error(
        "[STARTUP] Cannot start server without database connection",
      );
      process.exit(1);
    }

    // Start background latency injection job
    console.log(
      "[STARTUP] Starting background latency injection job (5s interval)",
    );
    setInterval(startLatencySimulation, 5000);

    // Start Express server
    app.listen(PORT, () => {
      console.log(
        `[STARTUP] ✓ DevPulse API Server running on http://localhost:${PORT}`,
      );
      console.log(`[STARTUP] ✓ Serving frontend from: ../Client`);
      console.log(`[STARTUP] ✓ API endpoint: GET /api/status`);
    });
  } catch (error) {
    console.error("[STARTUP] Fatal error:", error);
    process.exit(1);
  }
}

// ===== Graceful Shutdown =====
process.on("SIGTERM", async () => {
  console.log("[SHUTDOWN] SIGTERM received, closing connections...");
  if (db) await db.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[SHUTDOWN] SIGINT received, closing connections...");
  if (db) await db.end();
  process.exit(0);
});

// Start the server
startServer();
