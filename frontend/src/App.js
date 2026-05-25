import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BrainCog,
  Database,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { N8N_WEBHOOK_URL, WEBHOOK_ERROR_MESSAGE } from "./config/config";
import QueryConverterPage from "./pages/QueryConverterPage";
import DeploymentGuardTab from "./sections/DeploymentGuardTab";
import ExecutionSimulatorTab from "./sections/ExecutionSimulatorTab";

const defaultAssistantMessage = "Hi! Paste a SQL query, or ask me for a rewrite, index suggestion, or explanation.";

const quickActions = [
  "Explain current optimization",
  "Suggest better indexes",
  "Convert this to MongoDB",
  "Explain like beginner",
  "Explain like DBA",
  "Create deployment checklist",
];

const safeString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return fallback;
};

const safeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const renderChatContent = (content) => {
  const text = safeString(content, "");
  if (!text) {
    return <span>No response was returned.</span>;
  }

  if (!text.includes("```")) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  return text.split(/```/g).map((part, index) => {
    if (index % 2 === 1) {
      return (
        <pre key={`${index}-${part}`} className="mt-2 overflow-x-auto rounded-lg bg-slate-950/80 p-3 text-xs text-cyan-100 whitespace-pre-wrap">
          {part.trim()}
        </pre>
      );
    }

    return (
      <span key={`${index}-${part}`} className="whitespace-pre-wrap">
        {part}
      </span>
    );
  });
};

const normalizeValue = (value, fallback = "—") => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === "string") return value.trim() || fallback;
  return fallback;
};

const formatSQLQuery = (query) => {
  if (!query) return "";

  return query
    .replace(/\bSELECT\b/gi, "\nSELECT")
    .replace(/\bFROM\b/gi, "\nFROM")
    .replace(/\bINNER JOIN\b/gi, "\nINNER JOIN")
    .replace(/\bLEFT JOIN\b/gi, "\nLEFT JOIN")
    .replace(/\bRIGHT JOIN\b/gi, "\nRIGHT JOIN")
    .replace(/\bWHERE\b/gi, "\nWHERE")
    .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
    .replace(/\bORDER BY\b/gi, "\nORDER BY")
    .replace(/\bHAVING\b/gi, "\nHAVING")
    .replace(/\bLIMIT\b/gi, "\nLIMIT")
    .replace(/,/g, ",\n  ");
};

const cleanMarkdownJson = (text) => String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();

const getMetricNumber = (value) => {
  if (value === undefined || value === null || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "low") return 25;
    if (normalized === "medium") return 50;
    if (normalized === "high") return 75;
    if (normalized === "critical") return 100;

    const numericMatch = normalized.match(/-?\d+(?:\.\d+)?/);
    if (numericMatch) {
      return Number(numericMatch[0]);
    }

    return 0;
  }

  return 0;
};

const parseN8nAIResponse = (rawData) => {
  if (rawData === undefined || rawData === null) return null;

  if (typeof rawData === "string") {
    const trimmed = rawData.trim();
    if (!trimmed) return null;

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const source = fenced ? fenced[1].trim() : trimmed;

    try {
      return JSON.parse(source);
    } catch (error) {
      return { summary: cleanMarkdownJson(source) };
    }
  }

  if (Array.isArray(rawData)) {
    return rawData[0] || rawData;
  }

  if (typeof rawData === "object") {
    if (typeof rawData.output === "string") {
      const output = rawData.output.trim();
      const fenced = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const source = fenced ? fenced[1].trim() : output;

      try {
        return JSON.parse(source);
      } catch (error) {
        return { ...rawData, response: cleanMarkdownJson(source) };
      }
    }

    if (typeof rawData.response === "string") {
      const response = rawData.response.trim();
      const fenced = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const source = fenced ? fenced[1].trim() : response;

      try {
        return JSON.parse(source);
      } catch (error) {
        return { ...rawData, response: cleanMarkdownJson(source) };
      }
    }

    return rawData;
  }

  return null;
};

const normalizePerformancePrediction = (input = {}) => {
  const before = input.before || input.baseline || {};
  const after = input.after || input.optimized || {};

  const beforeLatency = normalizeValue(before.estimated_latency || before.latency || before.response_time, "0");
  const afterLatency = normalizeValue(after.estimated_latency || after.latency || after.response_time, beforeLatency);
  const beforeRows = normalizeValue(before.rows_scanned || before.rows || before.scan_rows, "0");
  const afterRows = normalizeValue(after.rows_scanned || after.rows || after.scan_rows, beforeRows);

  const latencyImprovement = (() => {
    const original = Number(beforeLatency);
    const current = Number(afterLatency);
    if (!Number.isFinite(original) || !Number.isFinite(current) || original === 0) {
      return normalizeValue(input.improvement_percentage || input.latency_improvement || input.improvement, "0%");
    }
    return `${Math.max(0, Math.round(((original - current) / original) * 100))}%`;
  })();

  return {
    before: {
      estimated_latency: beforeLatency,
      rows_scanned: beforeRows,
      cost: normalizeValue(before.cost || before.estimated_cost, "N/A"),
      cpu_impact: normalizeValue(before.cpu_impact || before.cpu || "N/A", "N/A"),
      memory_impact: normalizeValue(before.memory_impact || before.memory || "N/A", "N/A"),
    },
    after: {
      estimated_latency: afterLatency,
      rows_scanned: afterRows,
      cost: normalizeValue(after.cost || after.estimated_cost, "N/A"),
      cpu_impact: normalizeValue(after.cpu_impact || after.cpu || "N/A", "N/A"),
      memory_impact: normalizeValue(after.memory_impact || after.memory || "N/A", "N/A"),
    },
    improvement_percentage: latencyImprovement,
    rows_reduction: normalizeValue(input.rows_reduction || input.rows_improvement, "0%"),
  };
};

const normalizeAnalysisResult = (parsed) => {
  const raw = parsed?.data || parsed?.result || parsed?.output || parsed?.analysis || parsed || {};
  const normalized = parseN8nAIResponse(raw);

  const performancePrediction = normalized?.performance_prediction || normalized?.performance || normalized?.metrics || {};
  const optimizedQuery =
    normalized?.optimized_query ||
    normalized?.optimized_sql ||
    normalized?.rewritten_query ||
    normalized?.query_rewrite ||
    normalized?.generated_query ||
    normalized?.query ||
    "";

  return {
    mode: safeString(normalized?.mode || "analyze_query", "analyze_query"),
    risk_score_before: safeString(normalized?.risk_score_before || normalized?.risk_before || "N/A", "N/A"),
    risk_score_after: safeString(normalized?.risk_score_after || normalized?.risk_after || "N/A", "N/A"),
    summary: safeString(
      normalized?.summary ||
      normalized?.ai_summary ||
      normalized?.message ||
      normalized?.chat_response ||
      "",
      ""
    ),
    problems: safeList(normalized?.problems || normalized?.issues || normalized?.bottlenecks),
    optimized_query: optimizedQuery,
    generated_query: safeString(normalized?.generated_query || normalized?.optimized_query || normalized?.optimized_sql || "", ""),
    index_suggestions: safeList(normalized?.index_suggestions || normalized?.indexes || normalized?.index_recommendations || normalized?.recommendations),
    performance_prediction: performancePrediction && typeof performancePrediction === "object"
      ? normalizePerformancePrediction(performancePrediction)
      : {
          before: null,
          after: null,
          improvement_percentage: "N/A",
        },
    chart_metrics: normalized?.chart_metrics || {},
    beginner_explanation: safeString(normalized?.beginner_explanation || normalized?.explanation || normalized?.chat_response || "", ""),
    expert_explanation: safeString(normalized?.expert_explanation || normalized?.technical_explanation || "", ""),
    recommendations: safeList(normalized?.recommendations || normalized?.actions || normalized?.suggestions || normalized?.next_steps),
    schema_assumptions: safeList(normalized?.schema_assumptions || normalized?.assumptions || normalized?.notes),
    agent_trace: safeList(normalized?.agent_trace || normalized?.trace || normalized?.steps),
    deployment_guard: normalized?.deployment_guard || {},
    execution_simulation: normalized?.execution_simulation || null,
  };
};

const extractChatMessage = (parsed) => {
  const normalized = parseN8nAIResponse(parsed);

  return safeString(
    normalized?.chat_response ||
    normalized?.message ||
    normalized?.response ||
    normalized?.output ||
    normalized?.summary ||
    normalized?.optimized_query ||
    normalized?.rewritten_query ||
    normalized?.generated_query ||
    "",
    ""
  );
};

const isLikelySqlQuery = (text) => {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return false;
  const sqlMarkers = ["select ", "insert into ", "update ", "delete from ", "create table ", "alter table ", "with ", "join ", "where ", "group by ", "order by ", "limit ", "explain "];
  return sqlMarkers.some((marker) => normalized.includes(marker));
};

const isMongoLikeQuery = (text, databaseType) => {
  const normalized = text.trim();
  if (!normalized) return false;
  if (databaseType === "mongodb") return true;
  return /db\.[A-Za-z0-9_]+|aggregate\(|find\(|collection\s+|\{\s*"/.test(normalized);
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 25000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const getRiskBadge = (risk) => {
  const normalized = safeString(risk, "Medium").toLowerCase();
  if (normalized.includes("high") || normalized.includes("critical")) return "bg-red-950/70 text-red-100 border-red-500/40";
  if (normalized.includes("medium") || normalized.includes("moderate")) return "bg-amber-950/70 text-amber-100 border-amber-500/40";
  return "bg-emerald-950/70 text-emerald-100 border-emerald-500/40";
};

const formatScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  return String(value);
};

const defaultResultState = {
  mode: "analyze_query",
  risk_score_before: "N/A",
  risk_score_after: "N/A",
  summary: "",
  problems: [],
  optimized_query: "",
  generated_query: "",
  index_suggestions: [],
  performance_prediction: {
    before: null,
    after: null,
    improvement_percentage: "N/A",
  },
  chart_metrics: {},
  recommendations: [],
  schema_assumptions: [],
  beginner_explanation: "",
  expert_explanation: "",
  agent_trace: [],
  deployment_guard: {},
  execution_simulation: null,
};

export default function App() {
  const [query, setQuery] = useState("");
  const [schemaInput, setSchemaInput] = useState("");
  const [databaseType, setDatabaseType] = useState("mysql");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(defaultResultState);
  const [statusMessage, setStatusMessage] = useState("Ready to analyze your SQL.");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: defaultAssistantMessage },
  ]);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const addChatBubble = (role, content) => {
    setChatMessages((current) => [...current, { role, content: safeString(content, "No response was returned.") }]);
  };

  const copyQuery = async () => {
    const content = result.optimized_query || result.generated_query;
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedQuery(true);
      window.setTimeout(() => setCopiedQuery(false), 2000);
    } catch (error) {
      setErrorMessage("Unable to copy the query to the clipboard.");
    }
  };

  const sendChatMessage = async (messageText) => {
    const userMessage = messageText.trim();

    if (!userMessage) {
      setErrorMessage("Type a question before sending it to the assistant.");
      return;
    }

    addChatBubble("user", userMessage);
    setChatInput("");
    setChatLoading(true);
    setErrorMessage("");

    const greetingReply = (() => {
      const text = userMessage.toLowerCase();
      if (text.includes("hello") || text.includes("hi")) return "Hello! I can help optimize your query, suggest indexes, or explain the rewrite.";
      if (text.includes("thanks") || text.includes("thank you")) return "You're welcome. Paste a query whenever you want a deeper optimization review.";
      if (text.includes("help") || text.includes("assist")) return "I can analyze your SQL, compare before and after performance, and explain the reasoning in simple terms.";
      return null;
    })();

    if (greetingReply) {
      setChatLoading(false);
      addChatBubble("assistant", greetingReply);
      return;
    }

    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error(WEBHOOK_ERROR_MESSAGE);
      }

      const chatPayload = {
        mode: "chat",
        question: userMessage,
        schema: schemaInput.trim(),
        database_type: databaseType,
        previous_analysis: result,
        query: query.trim(),
        natural_language_request: userMessage,
      };

      console.log("CHAT PAYLOAD:", chatPayload);

      const response = await fetchWithTimeout(
        N8N_WEBHOOK_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatPayload),
        }
      );

      const text = await response.text();
      console.log("CHAT RAW RESPONSE:", text);

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      const parsed = parseN8nAIResponse(text);
      console.log("CHAT PARSED:", parsed);
      const chatMessage = extractChatMessage(parsed);

      if (!chatMessage) {
        addChatBubble("assistant", "AI response received, but no chatbot message field was found. Check console for parsed response.");
      } else {
        addChatBubble("assistant", chatMessage);
      }
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "The AI Agent is taking longer than expected. Please retry in a moment."
        : error?.message || "The chat request could not be completed right now.";
      addChatBubble("assistant", message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    await sendChatMessage(chatInput);
  };

  const handleQuickAction = (action) => {
    setChatOpen(true);
    void sendChatMessage(action);
  };

  const analyzeQuery = async () => {
    const trimmedQuery = query.trim();
    const hasActualQuery = trimmedQuery.length > 0;
    const isNaturalLanguageRequest = hasActualQuery && !isLikelySqlQuery(trimmedQuery) && !isMongoLikeQuery(trimmedQuery, databaseType);
    const naturalLanguageInput = trimmedQuery || schemaInput.trim();

    if (!hasActualQuery && !schemaInput.trim()) {
      setErrorMessage("Paste a SQL query or provide schema hints before analyzing.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setStatusMessage("Waiting for the AI Agent response...");

    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error(WEBHOOK_ERROR_MESSAGE);
      }

      const payload = {
        mode: hasActualQuery && !isNaturalLanguageRequest ? "analyze_query" : "generate_query",
        query: trimmedQuery,
        schema: schemaInput.trim(),
        database_type: databaseType,
        natural_language_request: naturalLanguageInput,
      };

      console.log("PAYLOAD SENT TO N8N:", payload);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log("RAW RESPONSE TEXT:", text);

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      const parsed = parseN8nAIResponse(text);
      console.log("PARSED RESPONSE:", parsed);
      const normalized = normalizeAnalysisResult(parsed);
      console.log("NORMALIZED RESULT:", normalized);

      setResult(normalized);
      setStatusMessage("Analysis complete. Review the summary and optimization guidance.");

      if (!normalized.optimized_query && !normalized.generated_query) {
        console.log("RAW PARSED RESPONSE FOR UI DEBUG:", parsed);
      }

      const assistantMessage = normalized.summary || normalized.optimized_query || normalized.generated_query || "AI response received, but no text field was found. Check console for parsed response.";
      if (chatMessages.length === 1) {
        setChatMessages([{ role: "assistant", content: assistantMessage }]);
      } else {
        addChatBubble("assistant", assistantMessage);
      }
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "The AI Agent took too long to respond. Please retry in a moment."
        : error?.message || "We could not reach the workflow. Verify the webhook URL and try again.";
      setErrorMessage(message);
      setStatusMessage("Analysis paused due to an error.");
      addChatBubble("assistant", message);
    } finally {
      setLoading(false);
    }
  };

  const performanceChartData = result
    ? [
        { name: "Before latency", latency: getMetricNumber(result.performance_prediction?.before?.estimated_latency) },
        { name: "After latency", latency: getMetricNumber(result.performance_prediction?.after?.estimated_latency) },
        { name: "Before rows", rows: getMetricNumber(result.performance_prediction?.before?.rows_scanned) },
        { name: "After rows", rows: getMetricNumber(result.performance_prediction?.after?.rows_scanned) },
      ]
    : [];

  const riskChartData = [
    { name: "Risk before", value: getMetricNumber(result.risk_score_before) },
    { name: "Risk after", value: getMetricNumber(result.risk_score_after) },
  ];

  const optimizationTitle = result?.mode === "generate_query" ? "Generated Query" : "Optimized Query";
  const isMongoDb = databaseType === "mongodb";
  const queryTypeLabel = isMongoDb ? "Generated MongoDB Aggregation" : "Optimized SQL Query";
  const queryLabel = isMongoDb ? "MongoDB Query / Aggregation Pipeline" : "SQL query";
  const schemaLabel = isMongoDb ? "Collection Schema" : "Schema hints";
  const queryPlaceholder = isMongoDb
    ? "db.orders.aggregate([{ $match: { createdAt: { $gte: ISODate('2025-01-01') } } }, { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } }])"
    : "SELECT * FROM users WHERE created_at > NOW() - INTERVAL 7 DAY;";
  const schemaPlaceholder = isMongoDb
    ? "orders: { _id, customerId, total, status, createdAt }\ncustomers: { _id, name, email }"
    : "CREATE TABLE users (id BIGINT, email VARCHAR(255), created_at TIMESTAMP);";
  const rawQuery = result.optimized_query || result.generated_query || "";
  const formattedQuery = isMongoDb
    ? (() => {
        try {
          const parsed = JSON.parse(rawQuery);
          return JSON.stringify(parsed, null, 2);
        } catch (error) {
          return rawQuery;
        }
      })()
    : formatSQLQuery(rawQuery);
  const topProblems = safeList(result.problems).slice(0, 3);
  const topSuggestions = safeList(result.index_suggestions).slice(0, 3);
  const performanceComparisonAvailable = result.mode === "analyze_query";
  const performanceMessage = "Performance comparison is available only when an original query is provided.";

  if (currentPage === "converter") {
    return <QueryConverterPage onBack={() => setCurrentPage("dashboard")} />;
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-2 shadow-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">QueryPilot AI</p>
              <h1 className="text-2xl font-bold text-white">Database Query Optimizer</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {loading ? "Analyzing" : "Ready"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <MessageSquare className="h-4 w-4" />
              {chatOpen ? "Hide assistant" : "Open assistant"}
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage("converter")}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
            >
              Query Converter
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pb-28 pt-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.45)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Input & control center</h2>
              <p className="mt-1 text-sm text-slate-300">Paste SQL, add schema hints, and let the AI Agent validate or rewrite it.</p>
            </div>

            <label className="block text-sm font-semibold text-slate-100">
              {queryLabel}
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={queryPlaceholder}
                className="mt-2 min-h-[170px] w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-100">
                Database type
                <select
                  value={databaseType}
                  onChange={(event) => setDatabaseType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlserver">SQL Server</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="oracle">Oracle</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-100">
                {schemaLabel}
                <textarea
                  value={schemaInput}
                  onChange={(event) => setSchemaInput(event.target.value)}
                  placeholder={schemaPlaceholder}
                  className="mt-2 min-h-[140px] w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={analyzeQuery}
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for AI Agent response…
                </>
              ) : (
                <>
                  <BrainCog className="h-4 w-4" />
                  Analyze Query
                </>
              )}
            </button>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-200">
              <span className="font-semibold text-cyan-200">Status:</span> {safeString(statusMessage, "Ready to analyze your query.")}
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.45)]">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mode</p>
                <p className="mt-2 text-lg font-semibold text-white">{result?.mode || "generate_query"}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latency</p>
                <p className="mt-2 text-lg font-semibold text-white">{normalizeValue(result?.performance_prediction?.after?.estimated_latency, "—")}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Improvement</p>
                <p className="mt-2 text-lg font-semibold text-emerald-300">{normalizeValue(result?.performance_prediction?.improvement_percentage, "0%")}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-slate-700 bg-slate-950/55 p-4">
              <p className="text-sm font-semibold text-white">AI summary</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {safeString(result?.summary, "Run an analysis to view the AI Agent summary, optimization rationale, and recommended improvements.")}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className={`rounded-full border px-3 py-1 text-sm ${getRiskBadge(result?.risk_score_before)}`}>
                  Risk before: {formatScore(result?.risk_score_before)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-sm ${getRiskBadge(result?.risk_score_after)}`}>
                  Risk after: {formatScore(result?.risk_score_after)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {result && (
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "overview", label: "Overview" },
                { key: "optimization", label: "Optimization" },
                { key: "execution", label: "Execution Simulator" },
                { key: "explanation", label: "Explanation" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Overview</h3>
                      <p className="mt-1 text-sm text-slate-300">Quick health check of the current recommendation and outstanding issues.</p>
                    </div>
                    <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                      {result.mode === "generate_query" ? "Generate" : "Analyze"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[20px] border border-slate-800 bg-slate-950/55 p-4">
                    <p className="text-sm font-semibold text-white">AI summary</p>
                    <p className="mt-3 text-sm leading-7 text-slate-200">
                      {safeString(result.summary, "Run an analysis to view the AI Agent summary, optimization rationale, and recommended improvements.")}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top issues</p>
                      <div className="mt-3 space-y-2">
                        {topProblems.length > 0 ? (
                          topProblems.map((item, index) => (
                            <p key={`${item}-${index}`} className="text-sm text-slate-100">• {safeString(item)}</p>
                          ))
                        ) : (
                          <p className="text-sm text-slate-300">No issue list was returned yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Index suggestions</p>
                      <div className="mt-3 space-y-2">
                        {topSuggestions.length > 0 ? (
                          topSuggestions.map((item, index) => (
                            <p key={`${item}-${index}`} className="text-sm text-slate-100">• {safeString(item)}</p>
                          ))
                        ) : (
                          <p className="text-sm text-slate-300">The workflow did not return indexing guidance.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5">
                  <h3 className="text-lg font-semibold text-white">Performance & risk</h3>
                  {performanceComparisonAvailable ? (
                    <>
                      <div className="mt-4 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1" />
                            <Tooltip contentStyle={{ backgroundColor: "#020617", borderRadius: 12, border: "1px solid #334155" }} />
                            <Bar dataKey="latency" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="rows" fill="#34d399" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Before</p>
                          <p className="mt-2 text-lg font-semibold text-white">{normalizeValue(result.performance_prediction?.before?.estimated_latency, "—")}</p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">After</p>
                          <p className="mt-2 text-lg font-semibold text-white">{normalizeValue(result.performance_prediction?.after?.estimated_latency, "—")}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-5 text-sm text-slate-200">
                      {performanceMessage}
                    </div>
                  )}

                  <div className="mt-5 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#cbd5e1" />
                        <YAxis stroke="#cbd5e1" />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderRadius: 12, border: "1px solid #334155" }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "optimization" && (
              <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
                <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">{queryTypeLabel}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{optimizationTitle}</h3>
                      <p className="mt-1 text-sm text-slate-300">Professional code view with formatting and quick copy actions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={copyQuery}
                      className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
                    >
                      {copiedQuery ? "Copied!" : "Copy query"}
                    </button>
                  </div>

                  {rawQuery ? (
                    <div className="mt-4 max-w-full overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950 shadow-[inset_0_1px_0_rgba(34,211,238,0.12)]">
                      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words p-5 font-mono text-sm leading-7 text-cyan-100">
                        <code>{formattedQuery}</code>
                      </pre>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-300">
                      AI response received, but no optimized query field was found. Check console for parsed response.
                    </p>
                  )}
                </section>

                <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5">
                  <h3 className="text-lg font-semibold text-white">Schema assumptions</h3>
                  <div className="mt-4 space-y-3">
                    {safeList(result.schema_assumptions).length > 0 ? (
                      safeList(result.schema_assumptions).map((item, index) => (
                        <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                          <Target className="mt-0.5 h-4 w-4 text-cyan-300" />
                          <p className="text-sm leading-6 text-slate-100">{safeString(item)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-300">No schema assumptions were returned by the workflow.</p>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "deployment" && (
              <DeploymentGuardTab result={result} />
            )}

            {activeTab === "execution" && (
              <ExecutionSimulatorTab result={result} />
            )}

            {activeTab === "explanation" && (
              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5">
                  <h3 className="text-lg font-semibold text-white">Beginner explanation</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-200">
                    {safeString(result.beginner_explanation, "The AI Agent did not return a beginner-friendly explanation.")}
                  </p>
                </section>

                <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5">
                  <h3 className="text-lg font-semibold text-white">Technical explanation</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-200">
                    {safeString(result.expert_explanation, "The AI Agent did not return a detailed explanation.")}
                  </p>
                </section>

                <section className="rounded-[24px] border border-slate-700 bg-slate-900/75 p-5 xl:col-span-2">
                  <h3 className="text-lg font-semibold text-white">Agent trace</h3>
                  <div className="mt-4 space-y-3">
                    {safeList(result.agent_trace).length > 0 ? (
                      safeList(result.agent_trace).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-100">
                          {safeString(item)}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-300">The workflow did not return any step trace for this response.</p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </main>

      {chatOpen && (
        <div className="fixed bottom-5 right-5 z-30 w-[min(92vw,380px)] rounded-[28px] border border-cyan-500/30 bg-slate-950/95 shadow-[0_30px_80px_rgba(15,23,42,0.75)]">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">AI Assistant</p>
              <p className="text-xs text-slate-300">Ask about rewrites, indexes, and explanations.</p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded-full bg-slate-800 p-2 text-slate-100 hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100"
                >
                  {action}
                </button>
              ))}
            </div>

            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-3 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "bg-cyan-500/10 text-cyan-50"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                {renderChatContent(message.content)}
              </div>
            ))}
            {chatLoading && (
              <div className="rounded-2xl bg-slate-800 px-3 py-3 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-slate-800 px-4 py-2">
            <button
              type="button"
              onClick={() => {
                setChatMessages([{ role: "assistant", content: defaultAssistantMessage }]);
              }}
              className="text-xs font-semibold text-slate-300"
            >
              Clear chat
            </button>
          </div>

          <form onSubmit={handleChatSubmit} className="border-t border-slate-800 px-4 py-3">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask the assistant"
                className="w-full rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="rounded-full bg-cyan-500 px-3 py-2 text-slate-950 transition hover:bg-cyan-400"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
