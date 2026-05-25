# ============================================================
# QueryPilot AI — Frontend Requirements
# Runtime: Node.js >= 16.x  |  Package manager: npm
# Install: npm install
# Start:   npm start
# Build:   npm run build
# ============================================================

# ── Core React ──────────────────────────────────────────────
# Entry point: src/index.js → src/App.js
react@^18.2.0
react-dom@^18.2.0

# ── React Scripts (CRA toolchain) ───────────────────────────
# Provides: webpack, babel, jest, eslint, dev-server
# Used by: package.json scripts (start / build / test / eject)
react-scripts@5.0.1

# ── Charts ──────────────────────────────────────────────────
# Used in: App.js, BenchmarkTab.jsx, ExecutionSimulatorTab.jsx, OverviewTab.jsx
# Components: BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
#             ResponsiveContainer
recharts@^2.10.0

# ── Icons ───────────────────────────────────────────────────
# Used in: App.js, ControlPanel.jsx, Header.jsx, FloatingAssistant.jsx,
#          QueryConverterPage.jsx, DeploymentGuardTab.jsx
# Icons: AlertCircle, ArrowLeft, BrainCog, CheckCircle2, Copy, Database,
#        Loader2, MessageSquare, RotateCcw, Send, Sparkles, Target, X
lucide-react@^0.292.0

# ── Styling ─────────────────────────────────────────────────
# Used in: all JSX files (utility classes), index.css, style.css
tailwindcss@^3.3.0

# ── Dev / Build tooling ─────────────────────────────────────
# Required by tailwindcss for CSS processing
autoprefixer@^10.4.16
postcss@^8.4.31

# ============================================================
# Environment variable required at runtime (NOT a package):
#   REACT_APP_N8N_WEBHOOK_URL
#   → Set in frontend/.env (see frontend/.env.example)
#   → Read in: src/config/config.js
#   → Used in: src/utils/api.js, src/App.js
# ============================================================
