# Prompt 1: Database Architecture & Resilient Backend (The Engine)
Copy & paste this into the LLM, filling in the brackets:

Context: Act as a Principal Backend Engineer. I need a production-ready server using [Your Backend Stack, e.g., Node.js/Express, Python/FastAPI, Go]. This server will act as the backend for a [Describe Your App, e.g., real-time chat application, e-commerce store].

Task 1: Database Setup & Connection

Provide the schema/models to create a database using [Your Database, e.g., PostgreSQL, MongoDB].

The core tables/collections should include: [List 3-4 core concepts, e.g., Users, Products, Orders]. Include relationships/foreign keys.

Setup a robust database connection pool using environment variables for host, user, password, and database name. Include error handling for connection failures.

Task 2: API Endpoints & Logic

Create the core API endpoints for [Specific action, e.g., fetching products, creating a user].

Wrap all database queries in try/catch (or equivalent) blocks. Return appropriate standard HTTP status codes and JSON error messages if the database fails.

Task 3: Security & Configuration

Implement basic security best practices (e.g., CORS, input validation/sanitization, rate limiting).

If serving a frontend from the same server, provide the static routing configuration.

Output clean, modular, async/await code with professional comments explaining the architecture choices.

---

# Prompt 2: Frontend Structure, Logic & Responsiveness (The Brain)
Wait for the backend to be generated, then copy & paste this into the LLM:

Context: Act as a Senior Frontend Architect. Create the frontend architecture using [Your Frontend Stack, e.g., React, Vue, Vanilla JS, Next.js] for the application we are building. The frontend must consume the APIs you just created.

Task 1: Semantic & Responsive HTML/Component Structure

Create a layout featuring: A premium navigation bar with a mobile hamburger toggle button, a main hero/header section, and a primary data-display section for [Your core feature, e.g., a product grid, a feed, a dashboard table].

Include an empty state, a loading indicator (e.g., a skeleton loader or spinner), and an error state container for when the API fails.

Use strictly semantic HTML5 and proper ARIA labels for accessibility.

Task 2: Data Fetching & State Management

Write the logic to fetch data from our backend API. Handle network errors gracefully and swap the UI to the error state if it fails.

Optional: Implement a polling mechanism or WebSocket connection if this app requires real-time updates.

Task 3: Dynamic Data Rendering

Map through the data payload and build interactive cards/list items.

Ensure the data rendering logic is modular and reusable.

Task 4: Mobile Navigation Logic

Write the state/event logic to toggle an active class on the mobile navigation menu and transform the hamburger button into an 'X' when clicked. Close the menu automatically when a link is clicked.

---

# Prompt 3: High-End UI Styling & Kinetic Animations (The Paint)
Copy & paste this into the LLM:

Context: Act as a World-Class Creative UI Designer and CSS Engineer. Write a comprehensive stylesheet (or Tailwind/CSS-in-JS config) for the frontend architecture created in the previous step. The aesthetic is a [Describe the Vibe, e.g., luxury dark-mode, clean Apple-style minimalist, vibrant playful SaaS].

Task 1: Core Layout & Responsive Breakpoints

Establish a modern CSS reset and a :root variable system for colors, typography, spacing, and transition timings.

Use CSS Grid and Flexbox for component alignment.

Write explicit media queries (@media (max-width: 768px)) to handle mobile layouts: stack complex grids into a single column, hide the desktop navigation, reveal the sliding mobile drawer, and adjust font sizes for readability.

Task 2: Custom Animations & Micro-Interactions

Entrance Animations: Create a fluid entrance animation for the core UI elements on page load (e.g., staggering items fading in and sliding slightly upward).

Hover States: Add premium interactive hover states to buttons and cards. Use subtle Y-axis lifts, drop-shadow adjustments, and smooth transition easing (cubic-bezier).

Specific Feature: Write the animation logic for [Insert a cool specific feature you want, e.g., a glowing button, a text-typing effect, a slot-machine text scroll].

Task 3: Accessibility & Polish

Ensure high color contrast ratios for text.

Custom style the scrollbar to match the app's aesthetic.

Include @media (prefers-reduced-motion: reduce) to disable heavy animations for users who prefer static layouts.

---

## 💡 How to use these for the best results:
Define your blanks first: Before pasting, replace the [bracketed text] with your exact needs. The more specific you are in the brackets, the better the output.

Use them in order: Keep all three prompts in the same chat window. Run Prompt 1, wait for the AI to finish, then run Prompt 2, then Prompt 3. This allows the AI to remember the database when writing the frontend, and remember the HTML when writing the CSS.