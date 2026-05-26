/**
 * DevPulse - Premium System Status Dashboard
 * Vanilla JavaScript • Zero Dependencies
 * Optimized for performance and minimal footprint
 */

const API_ENDPOINT = "/api/status";
const SPARKLINE_WIDTH = 120;
const SPARKLINE_HEIGHT = 32;
const SPARKLINE_PADDING = 4;
const UPDATE_INTERVAL = 30000; // 30 seconds

/**
 * Generates inline SVG sparkline from latency array
 * @param {number[]} latencies - Array of latency values (last 20)
 * @param {string} color - SVG stroke color
 * @returns {SVGSVGElement} Sparkline SVG element
 */
function createSparkline(latencies, color = "#00ffa3") {
  if (!latencies || latencies.length === 0) {
    latencies = [0];
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`);
  svg.setAttribute("class", "sparkline");
  svg.setAttribute("aria-hidden", "true");
  svg.style.width = "100%";
  svg.style.height = "auto";

  // Find min/max for scaling
  const maxLatency = Math.max(...latencies, 1);
  const minLatency = Math.min(...latencies);
  const range = maxLatency - minLatency || 1;

  // Calculate points for polyline
  const points = latencies
    .map((value, index) => {
      const x =
        (index / (latencies.length - 1 || 1)) *
          (SPARKLINE_WIDTH - SPARKLINE_PADDING * 2) +
        SPARKLINE_PADDING;
      const y =
        SPARKLINE_HEIGHT -
        ((value - minLatency) / range) *
          (SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2) -
        SPARKLINE_PADDING;
      return `${x},${y}`;
    })
    .join(" ");

  // Create polyline element
  const polyline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline",
  );
  polyline.setAttribute("points", points);
  polyline.setAttribute("stroke", color);
  polyline.setAttribute("stroke-width", "1.5");
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke-linecap", "round");
  polyline.setAttribute("stroke-linejoin", "round");

  // Create gradient fill area
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const gradient = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "linearGradient",
  );
  gradient.setAttribute(
    "id",
    `grad-${Math.random().toString(36).substr(2, 9)}`,
  );
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("y1", "0%");
  gradient.setAttribute("x2", "0%");
  gradient.setAttribute("y2", "100%");

  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", color);
  stop1.setAttribute("stop-opacity", "0.2");

  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", color);
  stop2.setAttribute("stop-opacity", "0");

  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);

  svg.appendChild(defs);
  svg.appendChild(polyline);

  return svg;
}

/**
 * Creates service status card with sparkline
 * @param {Object} service - Service data object
 * @returns {HTMLElement} Service card element
 */
function createServiceCard(service) {
  const card = document.createElement("article");
  card.className = `service-card status-${service.status.toLowerCase()}`;
  card.setAttribute("data-service", service.name);

  const statusIcon = getStatusIcon(service.status);
  const latencies = service.latencies?.slice(0, 20) || [];
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

  card.innerHTML = `
        <div class="service-header">
            <div class="service-title-group">
                <span class="status-indicator ${service.status.toLowerCase()}" title="${service.status}">
                    ${statusIcon}
                </span>
                <h3 class="service-name">${escapeHtml(service.name)}</h3>
            </div>
            <span class="service-region">${escapeHtml(service.region || "N/A")}</span>
        </div>

        <div class="service-metrics">
            <div class="metric">
                <span class="metric-label">Latency</span>
                <span class="metric-value">${avgLatency}ms</span>
            </div>
            <div class="metric">
                <span class="metric-label">Uptime</span>
                <span class="metric-value">${service.uptime || "99.9"}%</span>
            </div>
        </div>

        <div class="sparkline-container">
            <small class="sparkline-label">Last 20 samples</small>
        </div>
    `;

  // Append sparkline SVG to container
  const sparklineContainer = card.querySelector(".sparkline-container");
  const sparkline = createSparkline(
    latencies,
    getSparklineColor(service.status),
  );
  sparklineContainer.appendChild(sparkline);

  return card;
}

/**
 * Creates timeline event card
 * @param {Object} incident - Incident data object
 * @param {number} index - Card index for stagger animation
 * @returns {HTMLElement} Timeline card element
 */
function createTimelineEvent(incident, index) {
  const card = document.createElement("article");
  card.className = `timeline-event severity-${incident.severity?.toLowerCase() || "info"}`;
  card.style.setProperty("--stagger", index);

  const timestamp = new Date(incident.timestamp);
  const formattedTime = timestamp.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const duration = incident.duration
    ? formatDuration(incident.duration)
    : "Ongoing";

  card.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
            <div class="timeline-header">
                <h4 class="timeline-title">${escapeHtml(incident.title)}</h4>
                <span class="severity-badge ${incident.severity?.toLowerCase() || "info"}">
                    ${(incident.severity || "INFO").toUpperCase()}
                </span>
            </div>
            <p class="timeline-description">${escapeHtml(incident.description)}</p>
            <div class="timeline-meta">
                <time datetime="${incident.timestamp}">${formattedTime}</time>
                <span class="timeline-duration">${duration}</span>
            </div>
        </div>
    `;

  return card;
}

/**
 * Formats duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Returns status icon based on service status
 * @param {string} status - Service status
 * @returns {string} Icon character or symbol
 */
function getStatusIcon(status) {
  const icons = {
    operational: "●",
    degraded: "◐",
    offline: "○",
  };
  return icons[status.toLowerCase()] || "?";
}

/**
 * Returns appropriate sparkline color based on status
 * @param {string} status - Service status
 * @returns {string} Hex color value
 */
function getSparklineColor(status) {
  const colors = {
    operational: "#00ffa3", // Green
    degraded: "#ffa500", // Orange
    offline: "#ff6b6b", // Red
  };
  return colors[status.toLowerCase()] || "#00ffa3";
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Fetches status data from API
 * @returns {Promise<Object>} Status data
 */
async function fetchStatusData() {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch status data:", error);
    return null;
  }
}

/**
 * Renders services grid
 * @param {Array} services - Array of service objects
 */
function renderServices(services) {
  const grid = document.getElementById("services-grid");

  if (!services || services.length === 0) {
    grid.innerHTML = '<p class="empty-state">No services available</p>';
    return;
  }

  grid.innerHTML = "";
  services.forEach((service) => {
    const card = createServiceCard(service);
    grid.appendChild(card);
  });
}

/**
 * Renders incident timeline
 * @param {Array} incidents - Array of incident objects
 */
function renderTimeline(incidents) {
  const container = document.getElementById("timeline-events");

  if (!incidents || incidents.length === 0) {
    container.innerHTML = '<p class="empty-state">No incidents recorded</p>';
    return;
  }

  container.innerHTML = "";
  incidents.forEach((incident, index) => {
    const card = createTimelineEvent(incident, index);
    container.appendChild(card);
  });
}

/**
 * Initializes dashboard with data
 */
async function initializeDashboard() {
  const loading = document.getElementById("loading-indicator");

  // Show loading state
  loading.style.display = "block";

  const data = await fetchStatusData();

  if (data) {
    renderServices(data.services || []);
    renderTimeline(data.incidents || []);

    // Update last refresh timestamp
    updateRefreshTime();
  } else {
    document.getElementById("services-grid").innerHTML =
      '<p class="error-state">Unable to load status data. Please refresh.</p>';
  }

  // Hide loading state
  loading.style.display = "none";
}

/**
 * Updates the last refresh timestamp (optional)
 */
function updateRefreshTime() {
  const now = new Date();
  // Could store this in a footer or visible element
  console.log(`Dashboard updated at ${now.toLocaleTimeString()}`);
}

/**
 * Initializes periodic updates
 */
function startAutoRefresh() {
  // Update every 30 seconds
  setInterval(() => {
    initializeDashboard();
  }, UPDATE_INTERVAL);
}

/**
 * Entry point - Initialize when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
  startAutoRefresh();
});

// Allow manual refresh via console or external triggers
window.refreshDashboard = initializeDashboard;
