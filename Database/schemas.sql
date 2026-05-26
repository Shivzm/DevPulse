CREATE DATABASE devpulse;
USE devpulse;

-- 1. Services being monitored
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    current_status ENUM('operational', 'degraded', 'down') DEFAULT 'operational',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Latency logs for the real-time SVG charts
CREATE TABLE latency_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    latency_ms INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 3. Incident logs for the scroll-animated timeline
CREATE TABLE incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    impact ENUM('minor', 'major', 'critical') DEFAULT 'minor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial data
INSERT INTO services (name, slug, current_status) VALUES 
('Authentication API', 'auth-api', 'operational'),
('Payment Gateway', 'payment-gate', 'degraded'),
('Main CDN Worker', 'cdn-worker', 'operational');