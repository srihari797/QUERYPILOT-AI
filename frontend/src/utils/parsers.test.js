import {
  parseN8nAIResponse,
  normalizeAnalysisResult,
  extractChatMessage,
} from "./parsers";
import {
  safeString,
  safeList,
  formatSQLQuery,
  formatMongoQuery,
  getMetricNumber,
} from "./formatters";

describe("QueryPilot AI - Parsers & Formatters Test Suite", () => {
  describe("parseN8nAIResponse", () => {
    test("parses raw valid JSON string", () => {
      const raw = JSON.stringify({ mode: "chat", chat_response: "Hello there!" });
      const parsed = parseN8nAIResponse(raw);
      expect(parsed).toEqual({ mode: "chat", chat_response: "Hello there!" });
    });

    test("strips markdown json code fences", () => {
      const raw = "```json\n{\n  \"mode\": \"chat\",\n  \"chat_response\": \"Hi!\"\n}\n```";
      const parsed = parseN8nAIResponse(raw);
      expect(parsed.chat_response).toBe("Hi!");
    });

    test("handles n8n object with output string", () => {
      const raw = {
        output: '{"mode": "analyze_query", "summary": "Full table scan detected."}',
      };
      const parsed = parseN8nAIResponse(raw);
      expect(parsed.mode).toBe("analyze_query");
      expect(parsed.summary).toBe("Full table scan detected.");
    });

    test("handles null or undefined input safely", () => {
      expect(parseN8nAIResponse(null)).toBeNull();
      expect(parseN8nAIResponse(undefined)).toBeNull();
      expect(parseN8nAIResponse("")).toBeNull();
    });

    test("falls back to summary if response is plain text", () => {
      const raw = "I recommend adding an index on user_id.";
      const parsed = parseN8nAIResponse(raw);
      expect(parsed.summary).toBe(raw);
    });
  });

  describe("normalizeAnalysisResult", () => {
    test("normalizes analyze_query response with performance predictions", () => {
      const sample = {
        mode: "analyze_query",
        risk_score_before: "85",
        risk_score_after: "20",
        summary: "Query uses non-sargable YEAR() filter",
        problems: ["Full table scan on orders", "Non-sargable YEAR(created_at)"],
        optimized_query: "SELECT id, total FROM orders WHERE created_at >= '2024-01-01'",
        index_suggestions: ["CREATE INDEX idx_orders_created_at ON orders(created_at)"],
        performance_prediction: {
          before: { estimated_latency: "250", rows_scanned: "1000000" },
          after: { estimated_latency: "5", rows_scanned: "100" },
        },
      };

      const normalized = normalizeAnalysisResult(sample);
      expect(normalized.mode).toBe("analyze_query");
      expect(normalized.problems.length).toBe(2);
      expect(normalized.optimized_query).toContain("WHERE created_at >=");
      expect(normalized.performance_prediction.improvement_percentage).toBe("98%");
    });

    test("safely handles MongoDB object output without throwing", () => {
      const sample = {
        mode: "convert_query",
        converted_query: { $match: { status: "active" } },
        problems: [],
      };

      const normalized = normalizeAnalysisResult(sample);
      expect(typeof normalized.optimized_query).toBe("string");
    });
  });

  describe("formatters safeString & safeList", () => {
    test("safeString stringifies objects and avoids React child errors", () => {
      const obj = { $match: { age: { $gt: 25 } } };
      const result = safeString(obj);
      expect(typeof result).toBe("string");
      expect(result).toContain("$match");
    });

    test("safeList stringifies array containing objects", () => {
      const list = [
        "Normal string",
        { definition: "CREATE INDEX idx_user ON users(email)" },
      ];
      const result = safeList(list);
      expect(result.length).toBe(2);
      expect(typeof result[0]).toBe("string");
      expect(typeof result[1]).toBe("string");
    });

    test("formatSQLQuery formats clauses without crashing on non-strings", () => {
      const sql = "SELECT id, name FROM users WHERE id = 1";
      const formatted = formatSQLQuery(sql);
      expect(formatted).toContain("SELECT");
      expect(formatted).toContain("FROM");

      const objResult = formatSQLQuery({ $match: { id: 1 } });
      expect(typeof objResult).toBe("string");
    });

    test("formatMongoQuery formats JSON and handles plain string or objects", () => {
      const queryStr = '{"status": "active"}';
      expect(formatMongoQuery(queryStr)).toContain('"status": "active"');

      const queryObj = { status: "active" };
      expect(formatMongoQuery(queryObj)).toContain('"status": "active"');
    });

    test("getMetricNumber parses strings and numbers", () => {
      expect(getMetricNumber("120ms")).toBe(120);
      expect(getMetricNumber("critical")).toBe(100);
      expect(getMetricNumber("low")).toBe(25);
      expect(getMetricNumber(45)).toBe(45);
      expect(getMetricNumber(null)).toBe(0);
    });
  });
});
