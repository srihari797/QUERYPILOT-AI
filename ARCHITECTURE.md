# QueryPilot AI - System Architecture Document

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Multi-Agent System](#multi-agent-system)
4. [Data Flow](#data-flow)
5. [API Design](#api-design)
6. [Frontend Architecture](#frontend-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability & Performance](#scalability--performance)

---

## Overview

QueryPilot AI is an agentic AI system that uses multiple specialized Claude AI agents to analyze SQL queries and provide comprehensive optimization recommendations. Unlike traditional chatbots, it's designed with a clear agent-based architecture where each agent has a specific responsibility and agents work together to produce a complete analysis.

### Key Design Principles
1. **Separation of Concerns** - Each agent has one primary responsibility
2. **Sequential Processing** - Agents work in a logical order, each building on previous results
3. **Multi-Turn Reasoning** - Each agent can reason deeply about its domain
4. **Context Preservation** - Results flow from one agent to the next
5. **User-Centric Interface** - Complex backend logic hidden behind clean UI

---

## System Architecture

### High-Level Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│  React Dashboard  │  Interactive Charts  │  Chat Widget           │
│  Query Input      │  Performance Metrics │  Agent Status          │
└────────────┬───────────────────────────────────────────┬──────────┘
             │                                           │
             │ HTTP/REST                                 │
             │                                           │
┌────────────▼──────────────────────────────────────────▼──────────┐
│                    API LAYER (FastAPI)                           │
├──────────────────────────────────────────────────────────────────┤
│  POST /analyze        │  POST /chat           │ POST /report     │
│  Route Handler        │  Route Handler        │ Route Handler    │
│  Input Validation     │  Context Integration  │ Report Export    │
└────────────┬──────────────────────────────────────────┬──────────┘
             │                                           │
             │ Internal Communication                    │
             │                                           │
┌────────────▼──────────────────────────────────────────▼──────────┐
│                    AGENT ORCHESTRATION LAYER                     │
├──────────────────────────────────────────────────────────────────┤
│  QueryPilotAgent (Main Orchestrator)                             │
│  • Manages agent lifecycle                                        │
│  • Coordinates sequential execution                               │
│  • Aggregates results                                             │
│  • Error handling                                                 │
└────────────┬──────────────────────────────────────────────────────┘
             │
    ┌────────┴────────────────────────────────────────────┐
    │                                                      │
┌───▼────────────┐  ┌─────────────────┐  ┌──────────────┐│
│ Query Analyzer │  │  Index Advisor  │  │ Query Rewrite││
│ • Bottlenecks │  │  • Suggestions  │  │ • SQL rework ││
│ • Problems    │  │  • Impact score │  │ • Rationale  ││
│ • Complexity  │  │  • Priorities   │  │ • Pitfalls   ││
└───┬────────────┘  └────┬────────────┘  └───┬──────────┘│
    │                    │                     │          │
    │ Pass Through       │ Aggregate         │ Sequential
    │                    │                     │          │
┌───▼────────────┐  ┌─────────────────┐  ┌──────────────┐│
│ Risk Predictor │  │  Explainer      │  │Report Gener  ││
│ • Risks        │  │  • Beginner exp │  │ • Markdown  ││
│ • Safety score │  │  • Expert deep  │  │ • Formatted  ││
│ • Mitigation   │  │  • Concepts     │  │ • Ready-made ││
└────────────────┘  └─────────────────┘  └──────────────┘│
                                                          │
    ┌─────────────────────────────────────────────────────┘
    │ All agents communicate via JSON through orchestrator
    │
┌───▼────────────────────────────────────────────────────────┐
│              EXTERNAL API LAYER (Anthropic)                │
├────────────────────────────────────────────────────────────┤
│  Claude 3.5 Sonnet / Opus / Haiku                         │
│  • LLM capabilities for each agent                         │
│  • Prompt templates                                        │
│  • Response parsing and validation                         │
└────────────────────────────────────────────────────────────┘
```

---

## Multi-Agent System

### Agent Specifications

#### 1. Query Analyzer Agent
**Purpose**: Identify performance bottlenecks and issues

**Input**:
- SQL query
- Optional table schema
- Database type

**Process**:
1. Parse SQL query structure
2. Identify missing indexes
3. Detect inefficient patterns
4. Calculate complexity score
5. Assess join strategy

**Output**:
```json
{
  "bottlenecks": ["Missing index on created_at", "Full table scan"],
  "problems": [...],
  "complexity_score": 75,
  "missing_indexes": ["users(created_at)", "orders(status)"],
  "risk_score": "High"
}
```

**Key Algorithms**:
- Query structure analysis
- Table reference detection
- Join type identification
- Subquery detection
- Aggregation analysis

---

#### 2. Index Advisor Agent
**Purpose**: Recommend optimal database indexes

**Input**:
- Original query
- Query analysis from Analyzer Agent
- Table schema

**Process**:
1. Analyze query filter conditions
2. Identify index candidates
3. Calculate expected impact
4. Suggest composite indexes
5. Prioritize recommendations

**Output**:
```json
{
  "index_suggestions": [
    "CREATE INDEX idx_created_at ON users(created_at)",
    "CREATE INDEX idx_orders_user_status ON orders(user_id, status)"
  ],
  "expected_improvement": "60-70%",
  "priority": [
    {"index": "...", "priority": "HIGH", "impact": "40%"},
    {"index": "...", "priority": "MEDIUM", "impact": "15%"}
  ]
}
```

**Optimization Strategies**:
- Single-column indexes
- Composite/multi-column indexes
- Covering indexes
- Partial indexes
- Unique indexes

---

#### 3. Query Rewriter Agent
**Purpose**: Generate optimized SQL queries

**Input**:
- Original query
- Analysis results
- Suggested indexes
- Database type

**Process**:
1. Analyze current query structure
2. Apply optimization techniques
3. Preserve business logic
4. Generate rewritten query
5. Document changes

**Output**:
```json
{
  "optimized_query": "SELECT * FROM users WHERE created_at > ... WITH (NOLOCK)",
  "changes_made": [
    "Added index hint",
    "Rewrote subquery as JOIN",
    "Removed redundant conditions"
  ],
  "techniques_applied": [
    {"technique": "Index hint", "benefit": "Use optimal index"},
    {"technique": "Subquery to JOIN", "benefit": "Better optimizer plan"}
  ]
}
```

**Rewriting Techniques**:
- Subquery elimination
- Predicate pushdown
- Join order optimization
- Aggregate function optimization
- UNION optimization

---

#### 4. Risk Prediction Agent
**Purpose**: Assess safety and predict performance impact

**Input**:
- Original query
- Optimized query
- Analysis data

**Process**:
1. Identify potential risks
2. Assess backward compatibility
3. Predict performance metrics
4. Create mitigation strategies
5. Generate deployment plan

**Output**:
```json
{
  "risk_score_before": "High",
  "risk_score_after": "Low",
  "risks": [
    {"category": "Compatibility", "severity": "LOW"},
    {"category": "Data accuracy", "severity": "NONE"}
  ],
  "performance_predictions": {
    "latency_improvement": "80%",
    "cpu_reduction": "65%",
    "memory_reduction": "40%"
  },
  "deployment_safety": "SAFE"
}
```

**Risk Categories**:
- Backward compatibility
- Data accuracy
- Consistency issues
- Timeout risks
- Resource conflicts

---

#### 5. Explanation Agent
**Purpose**: Create multi-level explanations

**Input**:
- All previous analysis results
- Original and optimized queries

**Process**:
1. Simplify for beginners
2. Provide expert details
3. Explain key concepts
4. Link to resources
5. Clarify execution changes

**Output**:
```json
{
  "beginner_explanation": "Your query was slow because it looked at too many rows. We'll add an index to help it find the right data faster.",
  "expert_explanation": "Query was doing a full table scan with O(n) complexity. Added compound index on (user_id, status) reducing to O(log n) with index seek.",
  "key_concepts": [
    {"term": "Index", "explanation": "Database structure that speeds up lookups"},
    {"term": "Seek vs Scan", "explanation": "..."}
  ]
}
```

---

#### 6. Report Generator Agent
**Purpose**: Create comprehensive documentation

**Input**:
- All analysis data
- All agent outputs

**Process**:
1. Structure findings
2. Create executive summary
3. Detail recommendations
4. Include timelines
5. Format as markdown

**Output**: Professional markdown report with sections for:
- Executive Summary
- Issues & Severity
- Recommendations
- Implementation Plan
- Risk Assessment
- Appendices

---

#### 7. Chat Assistant Agent (Runtime)
**Purpose**: Answer follow-up questions with context

**Input**:
- User question
- Full analysis context

**Process**:
1. Understand question intent
2. Access relevant analysis data
3. Formulate response
4. Cite relevant metrics
5. Provide actionable advice

---

### Agent Execution Flow

```
User Submission
    ↓
┌─────────────────────────────────────┐
│ Phase 1: Analysis                   │
├─────────────────────────────────────┤
│ 1. Query Analyzer        [0-2s]     │
│    ↓ Pass results →                 │
│ 2. Index Advisor         [1-2s]     │
│    ↓ Pass results →                 │
│ 3. Query Rewriter        [2-3s]     │
│    ↓ Pass results →                 │
│ 4. Risk Predictor        [1-2s]     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Phase 2: Documentation              │
├─────────────────────────────────────┤
│ 5. Explainer             [2-3s]     │
│    ↓ Pass results →                 │
│ 6. Report Generator      [2-3s]     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Phase 3: Response Aggregation       │
├─────────────────────────────────────┤
│ • Compile results                   │
│ • Validate completeness             │
│ • Format for UI                     │
│ • Return to user                    │
└─────────────────────────────────────┘

Total time: ~12-15 seconds per analysis
```

---

## Data Flow

### Request Path

```
1. Frontend
   User enters query, schema, DB type
   ↓ POST /analyze
   
2. API Layer (FastAPI)
   Receives request
   Validates input (Pydantic)
   Passes to orchestrator
   ↓
   
3. Orchestrator
   Creates agent instances
   Initializes state
   Triggers phase 1
   ↓
   
4. Agent Pipeline
   Query Analyzer → Index Advisor → Query Rewriter
   ↓
   Risk Predictor → Explainer → Report Generator
   ↓
   Results aggregation
   
5. Response Generation
   Formats JSON response
   Includes metrics
   Includes agent trace
   ↓
   
6. API Response
   Returns to frontend
   ↓
   
7. Frontend
   Renders dashboard
   Shows results
   Enables chat
```

### Response Path

```
Backend Results
    ↓
┌──────────────────────────────────────┐
│ Response Data Structure              │
├──────────────────────────────────────┤
│ {                                    │
│   "agent_status": "completed",       │
│   "risk_score_before": "High",       │
│   "risk_score_after": "Low",         │
│   "problems": [...],                 │
│   "optimized_query": "...",          │
│   "index_suggestions": [...],        │
│   "performance_prediction": {...},   │
│   "explanations": {...},             │
│   "agent_trace": [...]               │
│ }                                    │
└──────────────────────────────────────┘
    ↓
Frontend Rendering
    ↓
├─ Risk Cards (Before/After)
├─ Charts (Latency, Rows Scanned)
├─ Optimization Details
├─ Index Recommendations
├─ Explanations
├─ Agent Trace
└─ Chat Ready
```

---

## API Design

### RESTful Endpoints

```
QueryPilot API v1
Base: http://localhost:8000

POST /analyze
├─ Request body:
│  {
│    "query": "SELECT ...",
│    "schema": "CREATE TABLE ...",
│    "database_type": "mysql|postgresql"
│  }
├─ Response: Complete analysis JSON
└─ Status: 200 OK | 400 Bad Request | 500 Error

POST /chat
├─ Request body:
│  {
│    "question": "Will this hurt writes?",
│    "context": { ...previous analysis... }
│  }
├─ Response: { "response": "...", "timestamp": "..." }
└─ Status: 200 OK | 400 Bad Request

POST /generate-report
├─ Request body: (same as /analyze)
├─ Response: { "report_md": "...", "analysis": {...} }
└─ Status: 200 OK

GET /health
├─ Response: { "status": "healthy", "service": "QueryPilot AI" }
└─ Status: 200 OK
```

### Request/Response Format

```
HTTP/1.1 POST /analyze
Host: localhost:8000
Content-Type: application/json
Accept: application/json

{
  "query": "SELECT * FROM users WHERE id = 123",
  "schema": "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255))",
  "database_type": "mysql"
}

---

HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 4532

{
  "agent_status": "completed",
  "risk_score_before": "Low",
  "risk_score_after": "Low",
  "summary": "No major issues found",
  "problems": [],
  "optimized_query": "SELECT * FROM users WHERE id = 123",
  "index_suggestions": [],
  "performance_prediction": {
    "before": {
      "estimated_latency": "5ms",
      "rows_scanned": "10",
      "cpu_impact": "1%",
      "memory_impact": "0MB"
    },
    "after": {
      "estimated_latency": "5ms",
      "rows_scanned": "10",
      "cpu_impact": "1%",
      "memory_impact": "0MB"
    },
    "improvement_percentage": "0%"
  },
  "beginner_explanation": "...",
  "expert_explanation": "...",
  "query_plan_steps": [],
  "agent_trace": [
    "Query Analyzer Agent - completed",
    "Index Advisor Agent - completed",
    "Query Rewriter Agent - completed",
    "Risk Predictor Agent - completed",
    "Explanation Agent - completed",
    "Report Generator Agent - completed"
  ],
  "report": "# Optimization Report\n..."
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App (Root)
├─ Header
│  ├─ Logo/Branding
│  ├─ Navigation
│  └─ Export Button
│
├─ Main Container (Grid Layout)
│  │
│  ├─ Left Panel (5 cols)
│  │  ├─ QueryInput
│  │  ├─ DatabaseType
│  │  ├─ SchemaInput
│  │  ├─ AnalyzeButton
│  │  └─ AgentTracePanel
│  │
│  └─ Right Panel (7 cols)
│     ├─ RiskScoreCards
│     │  ├─ BeforeCard
│     │  └─ AfterCard
│     │
│     ├─ TabContainer
│     │  ├─ OverviewTab
│     │  │  ├─ MetricsCards
│     │  │  ├─ LatencyChart
│     │  │  ├─ RowsScannedChart
│     │  │  └─ ProblemsAlert
│     │  │
│     │  ├─ OptimizationTab
│     │  │  ├─ OptimizedQueryCard
│     │  │  ├─ IndexSuggestions
│     │  │  └─ PerformanceImpact
│     │  │
│     │  ├─ ExplanationTab
│     │  │  ├─ BeginnerExplanation
│     │  │  └─ ExpertExplanation
│     │  │
│     │  └─ ChatTab
│     │     ├─ ChatMessages
│     │     └─ ChatInput
│     │
│     └─ PlaceholderWhenEmpty
│
└─ Footer (Optional)
   └─ Info/Links
```

### State Management

```
Component State:
├─ sqlQuery: string          // User's SQL query
├─ schemaInput: string       // Optional schema
├─ databaseType: string      // "mysql" | "postgresql"
├─ loading: boolean          // API call in progress
├─ analysis: object          // Full analysis result
├─ chatMessages: array       // Chat history
├─ chatInput: string         // Current chat message
├─ activeTab: string         // Current tab
└─ agentTraceExpanded: bool  // Agent trace visibility
```

### User Interactions

```
Query Analysis Flow:
1. User enters SQL query
2. User selects database type
3. (Optional) User enters schema
4. User clicks "Analyze Query"
   └─ Sets loading = true
   └─ Makes POST /analyze request
   └─ On response, sets analysis result
   └─ Sets loading = false
   └─ Initializes chat with summary

Chat Flow:
1. User types question
2. User presses Enter or clicks Send
   └─ Adds user message to chat
   └─ Makes POST /chat request
   └─ On response, adds AI message to chat
   └─ Clears input

Tab Navigation:
1. User clicks tab button
   └─ Sets activeTab to tab name
   └─ Renders corresponding tab content
```

---

## Deployment Architecture

### Local Development

```
Developer Machine
├─ Node.js (React Dev Server)
│  └─ http://localhost:3000
│     ├─ Hot reload enabled
│     └─ Proxy to /api → localhost:8000
│
└─ Python (Uvicorn Server)
   └─ http://localhost:8000
      ├─ CORS enabled for 3000
      └─ Auto-reload on changes
```

### Docker Containers

```
Docker Host
├─ querypilot-backend (Python)
│  ├─ Image: python:3.11-slim
│  ├─ Port: 8000
│  ├─ Env: ANTHROPIC_API_KEY
│  └─ Health check: /health
│
├─ querypilot-frontend (Node)
│  ├─ Build: node:18 (multi-stage)
│  ├─ Serve: serve
│  ├─ Port: 3000
│  └─ Depends on: backend
│
└─ Network: querypilot-network
   └─ Backend ↔ Frontend communication
```

### Production Deployment

```
Production Environment
├─ Load Balancer (Nginx/ALB)
│  ├─ HTTPS/TLS termination
│  └─ Route /api → backend
│
├─ Backend Tier (Kubernetes)
│  ├─ Replicas: 3-5
│  ├─ Autoscaling: 50-80% CPU
│  ├─ Liveness probes: /health
│  ├─ Readiness probes: /ready
│  └─ Environment: secrets
│
├─ Frontend Tier (CDN + S3)
│  ├─ CloudFront/CDN
│  ├─ S3 bucket
│  ├─ Static site hosting
│  └─ Cache policy: long-lived
│
└─ Monitoring
   ├─ Prometheus metrics
   ├─ Grafana dashboards
   ├─ Sentry error tracking
   ├─ CloudWatch logs
   └─ Performance monitoring
```

---

## Scalability & Performance

### Performance Optimization

#### Frontend
- Code splitting for faster initial load
- Lazy loading of chart components
- Memoization of expensive computations
- Virtual scrolling for long chat history
- CSS-in-JS for optimized styles

#### Backend
- Connection pooling for API calls
- Caching of common queries
- Rate limiting (10/min per IP)
- Timeout limits (30s per agent)
- Batch processing capability

#### AI Agent Calls
- Prompt caching (upcoming)
- Token optimization
- Parallel agent execution (where possible)
- Streaming responses (future)

### Scaling Strategies

```
Vertical Scaling (Single machine):
├─ More CPU cores → Parallel agent calls
├─ More RAM → Larger context windows
├─ Better GPU → Faster LLM inference (if local)
└─ Faster storage → Quicker cache hits

Horizontal Scaling (Multiple machines):
├─ Load balancer → Distribute requests
├─ Message queue → Async processing
├─ Cache layer (Redis) → Shared state
├─ Database → Persistent analysis history
└─ CDN → Distribute frontend

Microservices Architecture (Future):
├─ Agent service (Python)
├─ API Gateway
├─ Chat service
├─ Reporting service
├─ Analytics service
└─ Shared cache/database
```

### Performance Metrics

```
Target Metrics:
├─ API Response Time
│  ├─ Simple query: 5-8s
│  ├─ Complex query: 12-15s
│  └─ Chat response: 2-3s
│
├─ Frontend Performance
│  ├─ First Contentful Paint (FCP): < 1s
│  ├─ Largest Contentful Paint (LCP): < 2.5s
│  └─ Cumulative Layout Shift (CLS): < 0.1
│
├─ Backend Performance
│  ├─ API throughput: 10+ req/s per instance
│  ├─ CPU utilization: 40-60%
│  ├─ Memory usage: < 500MB per instance
│  └─ Latency p99: < 30s

└─ AI Agent Performance
   ├─ Agent response time: 1-3s each
   ├─ Token usage per request: < 3000
   └─ Error rate: < 0.5%
```

### Caching Strategy

```
Frontend Cache:
├─ HTTP caching headers
├─ Service worker for offline
├─ IndexedDB for analysis history
└─ LocalStorage for preferences

API Caching:
├─ Query fingerprinting
├─ 1-hour TTL for identical queries
├─ Cache invalidation on schema change
└─ User-specific caches (if authenticated)

AI Response Caching:
├─ Cache agent outputs
├─ Reuse for similar queries
└─ ML-based similarity matching
```

---

## Security Considerations

### API Security
- Input validation (Pydantic)
- SQL injection prevention (no real execution)
- CORS configuration
- Rate limiting
- API key rotation

### Data Security
- No query logging by default
- Sensitive data handling
- HTTPS in production
- Encryption at rest (if database added)
- Encryption in transit

### Frontend Security
- XSS prevention
- CSRF tokens
- Content Security Policy
- Secure headers
- Code obfuscation in production

---

## Monitoring & Observability

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rates and types
- Agent execution times
- API usage patterns
- User engagement metrics

### Logging Strategy
- Structured logging (JSON)
- Log levels (DEBUG, INFO, WARN, ERROR)
- Request/Response logging
- Agent trace logging
- Error stack traces

### Alerting
- API response time > 30s
- Error rate > 1%
- Agent failure rate > 5%
- API key issues
- Resource exhaustion

---

## Future Enhancements

```
Q1 2024:
├─ Real query execution analysis
├─ Database-specific optimizations
├─ Team collaboration
└─ Analysis history & versioning

Q2 2024:
├─ Machine learning recommendations
├─ Automated index management
├─ Performance monitoring integration
└─ IDE/Editor plugins

Q3 2024:
├─ Multi-database support
├─ Advanced visualization
├─ Batch query optimization
└─ CI/CD integration

Q4 2024:
├─ Enterprise features
├─ Custom models fine-tuning
├─ Global deployment
└─ Open source release
```

---

## Conclusion

QueryPilot AI demonstrates advanced AI-driven application architecture with:
- **Modular agent design** for specialized AI reasoning
- **Clean API boundaries** for scalability
- **Production-ready frontend** with professional UX
- **Deployment flexibility** (local, Docker, cloud)
- **Performance optimization** throughout
- **Enterprise security** considerations

This architecture supports both hackathon demo usage and enterprise-grade deployment.
