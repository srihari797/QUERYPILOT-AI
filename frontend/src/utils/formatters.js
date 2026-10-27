export const safeString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export const safeList = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined && item !== null)
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "number" || typeof item === "boolean") return String(item);
        if (typeof item === "object") {
          return (
            item.text ||
            item.description ||
            item.name ||
            item.title ||
            item.query ||
            item.suggestion ||
            item.problem ||
            JSON.stringify(item, null, 2)
          );
        }
        return String(item);
      })
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (typeof value === "object" && value !== null) {
    return [safeString(value)];
  }
  return [];
};

export const normalizeValue = (value, fallback = "—") => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export const getMetricNumber = (value) => {
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

export const formatScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  return String(value);
};

export const formatSQLQuery = (query) => {
  if (!query) return "";

  if (typeof query === "object") {
    try {
      return JSON.stringify(query, null, 2);
    } catch {
      return String(query);
    }
  }

  if (typeof query !== "string") {
    return String(query);
  }

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

export const formatMongoQuery = (query) => {
  if (!query) return "";

  if (typeof query === "object") {
    try {
      return JSON.stringify(query, null, 2);
    } catch {
      return String(query);
    }
  }

  try {
    const parsed = JSON.parse(query);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    return String(query);
  }
};

export const inferSeverity = (issue = "") => {
  const normalized = safeString(issue, "").toLowerCase();
  if (normalized.includes("select *") || normalized.includes("full table scan")) return "Critical";
  if (normalized.includes("missing index") || normalized.includes("function on") || normalized.includes("filesort")) return "High";
  return "Medium";
};

export const inferImpact = (issue = "") => {
  const normalized = safeString(issue, "").toLowerCase();
  if (normalized.includes("select *") || normalized.includes("full table scan")) return "High latency and high scan volume";
  if (normalized.includes("missing index") || normalized.includes("function on")) return "Index inefficiency and extra CPU";
  return "Moderate read pressure and slower response time";
};

export const inferDifficulty = (riskScore = "") => {
  const normalized = safeString(riskScore, "").toLowerCase();
  if (normalized.includes("critical") || normalized.includes("high")) return "High";
  if (normalized.includes("medium")) return "Medium";
  return "Low";
};
