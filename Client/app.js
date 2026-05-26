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
 * Sets up Intersection Observers for scroll-triggered animations
 */
function setupScrollObservers() {
  const spine = document.querySelector(".timeline-spine");
  const events = document.querySelectorAll(".timeline-event");

  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px",
  };

  const timelineObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Reveal the card
        entry.target.classList.add("reveal");

        // Drop down the vertical baseline
        if (spine) spine.classList.add("revealed");

        // Unobserve after revealing to prevent re-animating
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  events.forEach((event) => timelineObserver.observe(event));
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

  setupScrollObservers();
}

/**
 * Splits target text into spans for kinetic typography stagger effect
 */
function initTextEffects() {
  const textTarget = document.querySelector(".split-text");
  if (!textTarget) return;

  const content = textTarget.textContent;
  textTarget.innerHTML = "";

  content.split("").forEach((char, idx) => {
    const span = document.createElement("span");
    // Preserve spaces
    span.textContent = char === " " ? "\u00A0" : char;
    // Sync with CSS animation delay
    span.style.animationDelay = `${idx * 0.04}s`;
    textTarget.appendChild(span);
  });
}

/**
 * 1. Initializes the Solid Block Scroll Hover Effect on Navbar
 */
function initSheryNavEffect() {
    const links = document.querySelectorAll('.shery-link');
    
    links.forEach(link => {
        const text = link.innerText;
        link.innerHTML = ''; // Clear original text
        
        // The master wrapper that will physically move up
        const scrollWrap = document.createElement('div');
        scrollWrap.className = 'word-scroll-wrap';
        
        // The top word (default grey)
        const topWord = document.createElement('span');
        topWord.className = 'word-top';
        topWord.innerText = text;
        
        // The bottom word (glowing green)
        const bottomWord = document.createElement('span');
        bottomWord.className = 'word-bottom';
        bottomWord.innerText = text;
        
        scrollWrap.appendChild(topWord);
        scrollWrap.appendChild(bottomWord);
        link.appendChild(scrollWrap);
    });
}

/**
 * 2. Setup Click Handlers for Modal
 */
function setupClickInteractions() {
  const modal = document.getElementById("details-modal");
  const closeBtn = document.querySelector(".modal-close");
  const content = document.getElementById("modal-content");

  // Close modal logic
  const closeModal = () => modal.classList.remove("active");
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Listen for clicks on the parent grid/timeline (Event Delegation)
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".service-card");
    const event = e.target.closest(".timeline-event");

    if (card) {
      // Populate Service Modal
      const serviceName = card.querySelector(".service-name").innerText;
      const status = card.querySelector(".status-indicator").title;
      content.innerHTML = `
                <h3 class="modal-title">${serviceName}</h3>
                <p style="color: var(--text-muted)">Detailed metrics and history for this infrastructure block.</p>
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px;">
                    <strong>Current Status:</strong> <span style="text-transform: uppercase;">${status}</span>
                </div>
            `;
      modal.classList.add("active");
    }

    if (event) {
      // Populate Incident Modal
      const title = event.querySelector(".timeline-title").innerText;
      const desc = event.querySelector(".timeline-description").innerText;
      content.innerHTML = `
                <h3 class="modal-title">${title}</h3>
                <p style="color: var(--text-muted)">${desc}</p>
                <div style="margin-top: 1.5rem; padding: 1rem; border-left: 3px solid var(--status-degraded); background: rgba(255,255,255,0.03);">
                    <strong>Action Required:</strong> Team is actively monitoring logs.
                </div>
            `;
      modal.classList.add("active");
    }
  });
}

/**
 * Single Page Application (SPA) Router
 * Handles navigation without reloading the page
 */
function initRouter() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const views = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the "#" from jumping the page
            
            // Because of the Shery effect, we have to get the target from the parent 'a' tag
            const targetId = link.getAttribute('data-target') || link.closest('a').getAttribute('data-target');
            if (!targetId) return;

            // 1. Remove active state from all nav links
            navLinks.forEach(l => l.classList.remove('active'));
            // 2. Add active state to clicked link
            link.classList.add('active');

            // 3. Hide all views, show target view
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.add('active');
                    // Optional: re-trigger text split animation on the new page's hero
                    initTextEffects(); 
                }
            });
        });
    });
}

/**
 * 4. Admin Authentication & UI Logic
 */
function initAdminAuth() {
    const keyInput = document.getElementById('admin-key-input');
    const toggleEyeBtn = document.getElementById('toggle-eye-btn');
    const submitBtn = document.getElementById('auth-submit-btn');
    const errorMsg = document.getElementById('login-error-msg');
    
    const authForm = document.getElementById('admin-auth-form');
    const controlPanel = document.getElementById('admin-control-panel');
    const logoutBtn = document.getElementById('logout-btn');

    // SVGs for the Eye Icon states
    const iconEyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const iconEyeClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

    // Toggle Password Visibility
    toggleEyeBtn.addEventListener('click', () => {
        if (keyInput.type === 'password') {
            keyInput.type = 'text';
            toggleEyeBtn.innerHTML = iconEyeClosed;
        } else {
            keyInput.type = 'password';
            toggleEyeBtn.innerHTML = iconEyeOpen;
        }
    });

    // Handle Authentication Submit
    const authenticate = async () => {
        const key = keyInput.value.trim();
        if (!key) return;

        // Visual loading state
        submitBtn.innerText = 'Verifying...';
        submitBtn.style.opacity = '0.7';
        errorMsg.style.display = 'none';

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });

            const data = await response.json();

            if (data.success) {
                // Login Success: Swap UI
                authForm.style.display = 'none';
                controlPanel.style.display = 'block';
                keyInput.value = ''; // Clear the password for security
            } else {
                // Login Failed
                errorMsg.innerText = data.error || 'Access Denied.';
                errorMsg.style.display = 'block';
                
                // Add a quick shake animation for failure feedback
                keyInput.style.transform = 'translateX(10px)';
                setTimeout(() => keyInput.style.transform = 'translateX(-10px)', 100);
                setTimeout(() => keyInput.style.transform = 'translateX(0)', 200);
            }
        } catch (error) {
            errorMsg.innerText = 'Server communication error.';
            errorMsg.style.display = 'block';
        } finally {
            submitBtn.innerText = 'Authenticate';
            submitBtn.style.opacity = '1';
        }
    };

    submitBtn.addEventListener('click', authenticate);
    
    // Allow pressing "Enter" to submit
    keyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authenticate();
    });

    // Handle Logout
    logoutBtn.addEventListener('click', () => {
        controlPanel.style.display = 'none';
        authForm.style.display = 'block';
        
        // Reset eye icon to default closed
        keyInput.type = 'password';
        toggleEyeBtn.innerHTML = iconEyeOpen;
    });
}

/**
 * Mobile Navigation Menu Logic
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    if (!menuBtn || !navLinks) return;

    // Toggle menu open/close
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Automatically close the menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('active');
        });
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
  initTextEffects();
  initializeDashboard();
  initSheryNavEffect();
  initRouter();
  initAdminAuth();
  initMobileMenu();
  setupClickInteractions();
  startAutoRefresh();
});

// Allow manual refresh via console or external triggers
window.refreshDashboard = initializeDashboard;
