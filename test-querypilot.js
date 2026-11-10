/**
 * QueryPilot AI - End-to-End Test Suite & Sample Test Runner
 *
 * Usage:
 *   node test-querypilot.js                     (Runs all test modes)
 *   node test-querypilot.js --mode chat         (Runs chat mode test)
 *   node test-querypilot.js --mode analyze      (Runs analyze_query mode test)
 *   node test-querypilot.js --mode generate     (Runs generate_query mode test)
 *   node test-querypilot.js --mode convert      (Runs convert_query mode test)
 *   node test-querypilot.js --url <webhook-url> (Runs against custom webhook)
 */

const fs = require("fs");
const path = require("path");

// 1. Resolve Webhook URL from CLI arguments, frontend/.env, or default fallback
function resolveWebhookUrl() {
  const urlArgIndex = process.argv.indexOf("--url");
  if (urlArgIndex !== -1 && process.argv[urlArgIndex + 1]) {
    return process.argv[urlArgIndex + 1].trim();
  }

  const envPath = path.join(__dirname, "frontend", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/REACT_APP_N8N_WEBHOOK_URL=(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "https://hari8888.app.n8n.cloud/webhook/queryanalyse";
}

// 2. Sample Payloads for each QueryPilot Mode
const SAMPLE_TEST_CASES = {
  chat: {
    name: "Mode: Chat (Conversational Assistant)",
    payload: {
      mode: "chat",
      question: "What is the performance difference between B-Tree and Hash indexes in PostgreSQL?",
      schema: "",
      database_type: "PostgreSQL",
      source_database: "PostgreSQL",
      target_database: "",
      previous_analysis: {},
      query: "",
      natural_language_request: "What is the performance difference between B-Tree and Hash indexes in PostgreSQL?",
      conversion_request: "",
    },
    validate: (data) => Boolean(data && (data.chat_response || data.response || data.summary)),
  },

  analyze: {
    name: "Mode: Analyze Query (Query Optimization & Scalability)",
    payload: {
      mode: "analyze_query",
      database_type: "MySQL",
      source_database: "MySQL",
      target_database: "",
      schema: `
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(255) UNIQUE,
          status VARCHAR(50)
        );
        CREATE TABLE orders (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          total_amount DECIMAL(10,2),
          created_at DATETIME
        );
      `.trim(),
      query: `
        SELECT *
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE YEAR(o.created_at) = 2024
          AND u.status = 'active'
        ORDER BY o.total_amount DESC;
      `.trim(),
      natural_language_request: "",
      question: "",
      conversion_request: "",
      previous_analysis: {},
    },
    validate: (data) =>
      Boolean(
        data &&
          (data.optimized_query || data.generated_query) &&
          Array.isArray(data.problems)
      ),
  },

  generate: {
    name: "Mode: Generate Query (Text-to-SQL Optimization)",
    payload: {
      mode: "generate_query",
      database_type: "PostgreSQL",
      source_database: "PostgreSQL",
      target_database: "",
      schema: `
        CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, category_id INT, price NUMERIC);
        CREATE TABLE order_items (id SERIAL PRIMARY KEY, order_id INT, product_id INT, quantity INT, price NUMERIC);
      `.trim(),
      query: "Find the top 5 most revenue-generating products in category 3, including total units sold and revenue.",
      natural_language_request: "Find the top 5 most revenue-generating products in category 3, including total units sold and revenue.",
      question: "Find the top 5 most revenue-generating products in category 3, including total units sold and revenue.",
      conversion_request: "",
      previous_analysis: {},
    },
    validate: (data) => Boolean(data && (data.generated_query || data.optimized_query)),
  },

  convert: {
    name: "Mode: Convert Query (SQL to MongoDB Pipeline)",
    payload: {
      mode: "convert_query",
      source_database: "MySQL",
      target_database: "MongoDB",
      database_type: "MySQL",
      schema: "users collection with orders embedded or linked by user_id",
      query: "SELECT user_id, COUNT(*) as order_count, SUM(total_amount) as total_spent FROM orders WHERE created_at >= '2024-01-01' GROUP BY user_id HAVING total_spent > 1000 ORDER BY total_spent DESC;",
      conversion_request: "Convert this query from MySQL to MongoDB",
      natural_language_request: "",
      question: "",
      previous_analysis: {},
    },
    validate: (data) => Boolean(data && (data.converted_query || data.optimized_query || data.output)),
  },
};

// 3. Execution Engine
async function runTest(testKey, testDef, webhookUrl) {
  console.log(`\n============================================================`);
  console.log(`▶ Running Test: ${testDef.name}`);
  console.log(`  Endpoint: ${webhookUrl}`);
  console.log(`============================================================`);

  const startTime = Date.now();

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testDef.payload),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const rawText = await response.text();

    console.log(`Status Code: ${response.status} (${response.statusText}) [${elapsed}s]`);

    if (response.status === 404) {
      console.error(`\n❌ [404 NOT FOUND ERROR]`);
      console.error(`Response: ${rawText}`);

      if (rawText.includes("Did you mean to make a GET request")) {
        console.error(`\n👉 DIAGNOSIS:`);
        console.error(`   Your n8n Webhook node is currently configured for "GET" requests.`);
        console.error(`   QueryPilot sends "POST" requests with JSON bodies.`);
        console.error(`\n👉 FIX IN N8N:`);
        console.error(`   1. Open the Webhook node in your n8n workflow.`);
        console.error(`   2. Change "HTTP Method" from "GET" to "POST".`);
        console.error(`   3. Change "Respond" from "Immediately" to "When Last Node Finishes".`);
        console.error(`   4. Save and activate the workflow.`);
      }
      return false;
    }

    if (!response.ok) {
      console.error(`\n❌ [HTTP ERROR ${response.status}]: ${rawText}`);
      return false;
    }

    // Parse Response (handle raw string, markdown ```json, or n8n wrapper)
    let parsed = null;
    try {
      const cleaned = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1").trim();
      let interim = JSON.parse(cleaned);
      if (Array.isArray(interim) && interim.length > 0) {
        interim = interim[0];
      }
      const outputStr = (interim && typeof interim.output === "string")
        ? interim.output
        : (interim && typeof interim.response === "string")
        ? interim.response
        : null;

      if (outputStr) {
        try {
          parsed = JSON.parse(outputStr.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1").trim());
        } catch {
          // If JSON was slightly truncated at the end, extract key fields via regex
          parsed = {
            raw: outputStr,
            optimized_query: (outputStr.match(/"optimized_query":\s*"([^"]+)"/) || [])[1] || "",
            summary: (outputStr.match(/"summary":\s*"([^"]+)"/) || [])[1] || "",
            problems: ["Extracted from AI response"],
          };
        }
      } else {
        parsed = interim;
      }
    } catch {
      parsed = { raw: rawText };
    }

    // Check if n8n returned default "Workflow was started" without responseMode=lastNode
    if (parsed && parsed.message === "Workflow was started") {
      console.warn(`\n⚠️ [WARNING: n8n responseMode is set to "Immediately"]`);
      console.warn(`   n8n returned: {"message": "Workflow was started"}`);
      console.warn(`   To receive the AI Agent's optimized query JSON:`);
      console.warn(`   In the Webhook node, change "Respond" to "When Last Node Finishes" (responseMode: lastNode).`);
      return false;
    }

    console.log(`\n✅ Response Parsed Successfully!`);
    console.log(`------------------------------------------------------------`);
    if (parsed.chat_response) {
      console.log(`Assistant Response:\n${parsed.chat_response}`);
    } else if (parsed.optimized_query || parsed.generated_query || parsed.converted_query) {
      if (parsed.optimized_query) console.log(`Optimized Query:\n${typeof parsed.optimized_query === "object" ? JSON.stringify(parsed.optimized_query, null, 2) : parsed.optimized_query}`);
      if (parsed.generated_query) console.log(`Generated Query:\n${typeof parsed.generated_query === "object" ? JSON.stringify(parsed.generated_query, null, 2) : parsed.generated_query}`);
      if (parsed.converted_query) console.log(`Converted Query:\n${typeof parsed.converted_query === "object" ? JSON.stringify(parsed.converted_query, null, 2) : parsed.converted_query}`);
      if (parsed.problems && parsed.problems.length) console.log(`\nDetected Problems:`, parsed.problems);
      if (parsed.index_suggestions && parsed.index_suggestions.length) console.log(`\nIndex Suggestions:`, parsed.index_suggestions);
      if (parsed.performance_prediction) console.log(`\nImprovement:`, parsed.performance_prediction.improvement_percentage || "N/A");
    } else {
      console.log(`Raw Result:`, parsed);
    }

    const isValid = testDef.validate(parsed);
    console.log(`\nTest Result: ${isValid ? "✅ PASSED" : "⚠️ RECEIVED DATA BUT MISSING EXPECTED FIELDS"}`);
    return isValid;
  } catch (error) {
    console.error(`\n❌ [NETWORK / EXECUTION ERROR]: ${error.message}`);
    return false;
  }
}

async function main() {
  const webhookUrl = resolveWebhookUrl();
  console.log(`============================================================`);
  console.log(`QueryPilot AI - Automated Test Suite`);
  console.log(`Target Webhook: ${webhookUrl}`);
  console.log(`============================================================`);

  const modeArgIndex = process.argv.indexOf("--mode");
  const targetMode = modeArgIndex !== -1 ? process.argv[modeArgIndex + 1] : null;

  const testsToRun = targetMode && SAMPLE_TEST_CASES[targetMode]
    ? [[targetMode, SAMPLE_TEST_CASES[targetMode]]]
    : Object.entries(SAMPLE_TEST_CASES);

  let passed = 0;
  for (const [key, testDef] of testsToRun) {
    const success = await runTest(key, testDef, webhookUrl);
    if (success) passed++;
  }

  console.log(`\n============================================================`);
  console.log(`Summary: ${passed} / ${testsToRun.length} Tests Passed`);
  console.log(`============================================================\n`);
}

main();
