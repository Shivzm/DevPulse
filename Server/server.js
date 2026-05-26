const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database Connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'yourpassword',
    database: 'devpulse',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// API: Get overall status, recent latencies, and incident timelines
app.get('/api/status', async (req, res) => {
    try {
        const [services] = await db.query('SELECT * FROM services');
        const [incidents] = await db.query('SELECT * FROM incidents ORDER BY created_at DESC');
        
        // Fetch last 20 latency ticks for each service to draw charts
        const systemData = await Promise.all(services.map(async (service) => {
            const [logs] = await db.query(
                'SELECT latency_ms, recorded_at FROM latency_logs WHERE service_id = ? ORDER BY recorded_at DESC LIMIT 20',
                [service.id]
            );
            return { ...service, history: logs.reverse() };
        }));

        res.json({ services: systemData, incidents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BACKGROUND JOB: Simulate dynamic server ping latencies every 5 seconds
setInterval(async () => {
    try {
        const [services] = await db.query('SELECT id, current_status FROM services');
        for (let service of services) {
            // Generate latency based on current status
            let baseLatency = service.current_status === 'degraded' ? 350 : 40;
            let variance = Math.floor(Math.random() * 30);
            let latency = baseLatency + variance;

            await db.query('INSERT INTO latency_logs (service_id, latency_ms) VALUES (?, ?)', [service.id, latency]);
        }
    } catch (err) {
        console.error("Cron simulation error:", err);
    }
}, 5000);

app.listen(3000, () => console.log('DevPulse Engine running on port 3000'));