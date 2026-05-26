-- DevPulse Infrastructure Monitoring Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS devpulse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE devpulse;

-- ===== Services Table =====
-- Stores infrastructure services monitored by the system
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    current_status ENUM('operational', 'degraded', 'offline') DEFAULT 'operational',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (current_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== Latency Logs Table =====
-- Stores real-time latency measurements for each service
CREATE TABLE IF NOT EXISTS latency_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    latency_ms INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_service_time (service_id, recorded_at),
    INDEX idx_service_recent (service_id, recorded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== Incidents Table =====
-- Stores historical incident records with severity and duration
CREATE TABLE IF NOT EXISTS incidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration INT COMMENT 'Duration in milliseconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_severity (severity),
    INDEX idx_timestamp (timestamp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== Seed Data =====
-- Sample services for testing
INSERT IGNORE INTO services (id, name, slug, current_status) VALUES
(1, 'API Gateway', 'api-gateway', 'operational'),
(2, 'Database Primary', 'database-primary', 'operational'),
(3, 'Cache Layer', 'cache-layer', 'operational'),
(4, 'Authentication', 'authentication', 'operational'),
(5, 'Load Balancer', 'load-balancer', 'operational');

-- Sample incidents
INSERT IGNORE INTO incidents (id, title, description, severity, timestamp, duration) VALUES
(1, 'Database Query Latency Spike', 'Observed 2x increase in query response times from 50ms to 120ms', 'warning', DATE_SUB(NOW(), INTERVAL 2 HOUR), 1800000),
(2, 'Cache Synchronization Delay', 'Redis cluster experienced brief replication lag', 'info', DATE_SUB(NOW(), INTERVAL 4 HOUR), 300000),
(3, 'API Rate Limiting Event', 'Temporary service degradation due to traffic spike', 'warning', DATE_SUB(NOW(), INTERVAL 6 HOUR), 900000);

-- Create stored procedure to get current system status (optional performance optimization)
DELIMITER $$

CREATE PROCEDURE sp_get_system_status()
BEGIN
    SELECT 
        s.id,
        s.name,
        s.slug,
        s.current_status,
        ROUND(AVG(ll.latency_ms), 2) as avg_latency,
        MIN(ll.latency_ms) as min_latency,
        MAX(ll.latency_ms) as max_latency,
        COUNT(ll.id) as total_samples
    FROM services s
    LEFT JOIN latency_logs ll ON s.id = ll.service_id 
        AND ll.recorded_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    GROUP BY s.id, s.name, s.slug, s.current_status
    ORDER BY s.id;
END$$

DELIMITER ;
