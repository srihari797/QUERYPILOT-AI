# QueryPilot AI 🚀
### Autonomous Database Performance Engineering & Agentic AI Query Optimizer

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-00DFD8?style=for-the-badge&logo=vercel&logoColor=black)](https://querypilot-hybdd1j6i-sri-hari-s-projects.vercel.app/)
[![React 18](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **🌐 Live Deployment:** [https://querypilot-hybdd1j6i-sri-hari-s-projects.vercel.app/](https://querypilot-hybdd1j6i-sri-hari-s-projects.vercel.app/)

---

## 📌 Overview

**QueryPilot AI** is an advanced autonomous database performance engineering assistant. It analyzes complex SQL and NoSQL queries, detects performance anti-patterns (such as non-sargable functions, full-table scans, filesorts, and unindexed joins), rewrites inefficient queries into sargable index-backed code, simulates query scalability across data volumes from 1K to 100M rows, and converts queries between SQL and MongoDB.

---

## ✨ Key Features

### ⚡ 1. Intelligent Query Optimizer
- **Anti-Pattern Detection:** Detects `SELECT *`, non-sargable functions (like `YEAR(col)`), unindexed filters, missing composite keys, and memory-intensive filesorts.
- **Automated Rewriting:** Produces optimized, formatted SQL queries with one-click clipboard copying.
- **Index Suggestions:** Provides exact `CREATE INDEX` statements tailored to predicates, joins, and sorting criteria.

### 📊 2. Performance & Risk Impact Prediction
- **Latency & Row Scan Metrics:** Predicts before vs. after query execution latency and row scan reductions (e.g., $90\%+$ improvements).
- **Interactive Risk Heatmaps:** Visualizes risk scores before and after optimization with color-coded risk severity badges.

### 📈 3. Scale-Aware Execution Simulator
- **Interactive Scalability Simulation:** Test query behavior dynamically across **1K, 100K, 1M, 10M, and 100M rows**.
- **Complexity Analysis:** Compares linear scan growth ($O(N)$) against indexed logarithmic lookups ($O(\log N)$).
- **Bottleneck Forecaster:** Highlights threshold limits before queries require partitioning or materialized views.

### 🎓 4. Dual-Audience Explanations & Transparent Agent Trace
- **Beginner Analogy:** Intuitive explanations using relatable physical analogies (e.g., filing cabinets and indexes).
- **DBA-Grade Technical Insights:** In-depth breakdown of join buffers, index range scans, covering indexes, and I/O overhead.
- **Agent Execution Trace:** Step-by-step visibility into the AI's diagnostic reasoning and plan evaluation.

### 🔄 5. Bidirectional SQL ↔ MongoDB Query Converter
- **SQL to MongoDB Aggregation:** Seamlessly converts relational `SELECT`, `JOIN`, `WHERE`, `GROUP BY`, and `ORDER BY` statements into modern MongoDB aggregation pipelines (`$match`, `$lookup`, `$unwind`, `$sort`, `$project`).
- **MongoDB to SQL:** Translates MongoDB find/aggregate queries back into standardized relational SQL.
- **Target Index Guidance:** Generates database-specific index scripts (`db.collection.createIndex()`).

### 💬 6. Interactive AI Performance Assistant
- **Slide-out Assistant:** Conversational chat drawer equipped with one-click quick actions:
  - *"Explain like DBA"*
  - *"Suggest better indexes"*
  - *"Convert this to MongoDB"*
  - *"Explain like beginner"*
  - *"Create deployment checklist"*
- **Rich Markdown:** Supports syntax-highlighted code snippets, inline code badges, and formatted checklists.

---

## 🛠️ Supported Databases

| Engine | Query Format | Indexing Support | Dialect Features |
| :--- | :--- | :--- | :--- |
| **MySQL** | Standard SQL | B-Tree, Composite | Sargable range transforms, filesort reduction |
| **PostgreSQL** | Standard / PL-pgSQL | B-Tree, Hash, GIN | Cost estimation, explain analysis |
| **MongoDB** | Aggregation Pipeline / MQL | Single, Compound | `$match`, `$lookup`, pipeline optimization |
| **SQLite** | Lightweight SQL | B-Tree | Index-based rowid lookups |
| **SQL Server (T-SQL)** | T-SQL | Clustered, Non-Clustered | Execution plan hints, TOP/OFFSET pagination |
| **Oracle** | PL/SQL | B-Tree, Bitmap | Cost-based optimizer modeling |

---

## 🏗️ Architecture

```mermaid
flowchart LR
    User[User / Developer] --> Frontend[React 18 Frontend\nTailwind CSS + Recharts]
    Frontend --> Webhook[n8n Workflow Engine\nWebhook Endpoint]
    Webhook --> Groq[Groq AI Model\nopenai/gpt-oss]
    Groq --> Webhook
    Webhook --> Parser[Auto-Healing JSON Parser\nparsers.js]
    Parser --> Dashboard[QueryPilot Dashboard\nOverview | Optimization | Simulator | Converter]
```

- **Frontend:** Built with React 18, Tailwind CSS, Lucide Icons, and Recharts.
- **Backend Workflow:** Orchestrated via n8n with Groq LLM integration.
- **Resilient Parsing:** Includes custom auto-healing JSON repair and recursive envelope unwrapping in [`frontend/src/utils/parsers.js`](frontend/src/utils/parsers.js) to safeguard against token limits and truncated stream outputs.
- **Hosting:** Deployed globally on Vercel.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/srihari797/QUERYPILOT-AI.git
cd QUERYPILOT-AI
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `frontend/` directory:
```env
REACT_APP_N8N_WEBHOOK_URL=https://hari8888.app.n8n.cloud/webhook/queryanalyse
```

### 4. Run the Development Server
```bash
npm start
```
The app will open automatically at [http://localhost:3000](http://localhost:3000).

### 5. Run Automated Tests
```bash
npm test -- --watchAll=false
```

### 6. Production Build
```bash
npm run build
```

---

## 🌐 Live Application

Access the live cloud deployment on Vercel:

👉 **[https://querypilot-hybdd1j6i-sri-hari-s-projects.vercel.app/](https://querypilot-hybdd1j6i-sri-hari-s-projects.vercel.app/)**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
