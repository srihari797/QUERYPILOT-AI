import { safeList, safeString, normalizeValue } from "./formatters";

export const cleanMarkdownJson = (text) =>
  String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

export const repairAndParseJson = (text) => {
  if (text === undefined || text === null) return null;
  if (typeof text !== "string") {
    if (typeof text === "object") return text;
    return null;
  }

  const cleaned = cleanMarkdownJson(text);
  if (!cleaned) return null;

  // 1. Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Continue to repair
  }

  // 2. Locate outermost JSON opening
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  const s = cleaned.slice(startIdx);

  // 3. Progressively heal truncated JSON by scanning backwards
  for (let cut = 0; cut < 600 && s.length - cut > 5; cut++) {
    const candidate = cut === 0 ? s : s.slice(0, -cut);
    let inString = false;
    let escaped = false;
    const stack = [];

    for (let i = 0; i < candidate.length; i++) {
      const ch = candidate[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (ch === "{" || ch === "[") {
          stack.push(ch);
        } else if (ch === "}") {
          if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
        } else if (ch === "]") {
          if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
        }
      }
    }

    let repaired = candidate;
    if (inString) {
      repaired += '"';
    }
    repaired = repaired.replace(/,\s*$/, "");
    for (let j = stack.length - 1; j >= 0; j--) {
      repaired += stack[j] === "{" ? "}" : "]";
    }

    try {
      return JSON.parse(repaired);
    } catch (err) {
      // Continue next cut
    }
  }

  // 4. Regex extraction fallback for key fields if repair loop fails
  const extractField = (key, isArray = false) => {
    if (isArray) {
      const arrayMatch = s.match(new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)(?:\\]|$)`));
      if (arrayMatch) {
        const items = [];
        const itemRegex = /"((?:\\.|[^"\\])*)"/g;
        let m;
        while ((m = itemRegex.exec(arrayMatch[1])) !== null) {
          items.push(m[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"));
        }
        return items;
      }
      return null;
    } else {
      const strMatch = s.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
      if (strMatch) {
        return strMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
      }
      return null;
    }
  };

  const extracted = {};
  const extractedSummary = extractField("summary");
  const extractedOptimized = extractField("optimized_query");
  const extractedGenerated = extractField("generated_query");
  const extractedConverted = extractField("converted_query");
  const extractedProblems = extractField("problems", true);
  const extractedIndexes = extractField("index_suggestions", true);
  const extractedRiskBefore = extractField("risk_score_before");
  const extractedRiskAfter = extractField("risk_score_after");

  if (
    extractedSummary ||
    extractedOptimized ||
    extractedGenerated ||
    extractedConverted ||
    (extractedProblems && extractedProblems.length > 0)
  ) {
    extracted.mode = extractField("mode") || "analyze_query";
    if (extractedSummary) extracted.summary = extractedSummary;
    if (extractedOptimized) extracted.optimized_query = extractedOptimized;
    if (extractedGenerated) extracted.generated_query = extractedGenerated;
    if (extractedConverted) extracted.converted_query = extractedConverted;
    if (extractedProblems) extracted.problems = extractedProblems;
    if (extractedIndexes) extracted.index_suggestions = extractedIndexes;
    if (extractedRiskBefore) extracted.risk_score_before = extractedRiskBefore;
    if (extractedRiskAfter) extracted.risk_score_after = extractedRiskAfter;
    return extracted;
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

export const parseN8nAIResponse = (rawData) => {
  if (rawData === undefined || rawData === null) return null;

  if (typeof rawData === "string") {
    const trimmed = rawData.trim();
    if (!trimmed) return null;

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const source = fenced ? fenced[1].trim() : trimmed;

    const repaired = repairAndParseJson(source);
    if (repaired && typeof repaired === "object") {
      return repaired;
    }

    return { summary: cleanMarkdownJson(source) };
  }

  if (Array.isArray(rawData)) {
    return rawData[0] || rawData;
  }

  if (typeof rawData === "object") {
    if (
      rawData.optimized_query !== undefined ||
      rawData.generated_query !== undefined ||
      rawData.converted_query !== undefined ||
      rawData.chat_response !== undefined
    ) {
      return rawData;
    }

    if (typeof rawData.output === "string") {
      const output = rawData.output.trim();
      const fenced = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const source = fenced ? fenced[1].trim() : output;

      const repaired = repairAndParseJson(source);
      if (repaired && typeof repaired === "object") {
        return repaired;
      }
      return { ...rawData, response: cleanMarkdownJson(source) };
    }

    if (typeof rawData.response === "string") {
      const response = rawData.response.trim();
      const fenced = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      const source = fenced ? fenced[1].trim() : response;

      const repaired = repairAndParseJson(source);
      if (repaired && typeof repaired === "object") {
        return repaired;
      }
      return { ...rawData, response: cleanMarkdownJson(source) };
    }

    return rawData;
  }

  return null;
};

export const normalizeAnalysisResult = (parsed) => {
  const raw = parsed?.data || parsed?.result || parsed?.output || parsed?.analysis || parsed || {};
  let normalized = parseN8nAIResponse(raw) || {};

  // If summary itself was loaded with an unparsed JSON string, unpack it now
  if (
    typeof normalized.summary === "string" &&
    (normalized.summary.trim().startsWith("{") ||
      normalized.summary.includes('"mode":') ||
      normalized.summary.includes('"optimized_query":'))
  ) {
    const unpacked = repairAndParseJson(normalized.summary);
    if (unpacked && typeof unpacked === "object") {
      normalized = {
        ...unpacked,
        ...normalized,
        summary: unpacked.summary || "Query analyzed and rewritten for improved indexing and scan reduction.",
      };
    }
  }

  // Ensure summary is never a raw JSON blob
  let summaryText = safeString(
    normalized?.summary || normalized?.ai_summary || normalized?.message || normalized?.chat_response || "",
    ""
  );
  if (summaryText.startsWith("{") && summaryText.includes('"summary":')) {
    const summaryMatch = summaryText.match(/"summary"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (summaryMatch) {
      summaryText = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    } else {
      summaryText = "Query analysis complete. Review the rewritten query, index suggestions, and execution plan below.";
    }
  }

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
    summary: summaryText,
    problems: safeList(normalized?.problems || normalized?.issues || normalized?.bottlenecks),
    optimized_query: safeString(optimizedQuery, ""),
    generated_query: safeString(normalized?.generated_query || normalized?.optimized_query || normalized?.optimized_sql || "", ""),
    converted_query: safeString(normalized?.converted_query || "", ""),
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
    explanation: safeString(
      normalized?.explanation ||
      normalized?.beginner_explanation ||
      normalized?.expert_explanation ||
      summaryText ||
      "",
      ""
    ),
    action_items: safeList(normalized?.action_items || normalized?.actions || normalized?.recommendations),
    recommendations: safeList(
      normalized?.action_items ||
      normalized?.recommendations ||
      normalized?.actions ||
      normalized?.suggestions ||
      normalized?.next_steps
    ),
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
