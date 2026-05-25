import { safeList, safeString, normalizeValue } from "./formatters";

const cleanMarkdownJson = (text) => String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();

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

export const parseN8nAIResponse = (rawData) => {
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

export const normalizeAnalysisResult = (parsed) => {
  const raw = parsed?.data || parsed?.result || parsed?.output || parsed?.analysis || parsed || {};
  const normalized = parseN8nAIResponse(raw) || {};

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
      normalized?.summary || normalized?.ai_summary || normalized?.message || normalized?.chat_response || "",
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

export const extractChatMessage = (parsed) => {
  const normalized = parseN8nAIResponse(parsed) || {};

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
