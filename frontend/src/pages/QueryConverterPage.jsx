import React, { useState } from "react";
import { ArrowLeft, Copy, RotateCcw } from "lucide-react";
import { callQueryPilotWebhook } from "../utils/api";
import { parseN8nAIResponse } from "../utils/parsers";

const sourceDatabases = [
  "MySQL",
  "PostgreSQL",
  "SQLite",
  "Oracle",
  "SQL Server",
  "MongoDB",
];

const targetDatabases = ["MongoDB", "MySQL", "PostgreSQL", "SQLite", "Oracle", "SQL Server"];

const displayValue = (value) => value || "";

const getConvertedOutput = (parsed) => {
  const normalized = parseN8nAIResponse(parsed);

  if (!normalized) {
    return "";
  }

  return (
    displayValue(normalized.converted_query) ||
    displayValue(normalized.convertedQuery) ||
    displayValue(normalized.optimized_query) ||
    displayValue(normalized.generated_query) ||
    displayValue(normalized.query) ||
    displayValue(normalized.output) ||
    displayValue(normalized.response) ||
    displayValue(normalized.chat_response) ||
    displayValue(normalized.summary)
  );
};

const QueryConverterPage = ({ onBack }) => {
  const [sourceDatabase, setSourceDatabase] = useState("MySQL");
  const [targetDatabase, setTargetDatabase] = useState("MongoDB");
  const [schemaInput, setSchemaInput] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [convertedQuery, setConvertedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!sourceQuery.trim()) {
      setErrorMessage("Add a source query before converting.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setCopied(false);

    try {
      const payload = {
        mode: "convert_query",
        source_database: sourceDatabase,
        target_database: targetDatabase,
        database_type: sourceDatabase,
        query: sourceQuery,
        schema: schemaInput,
        conversion_request: `Convert this query from ${sourceDatabase} to ${targetDatabase}`,
      };

      const response = await callQueryPilotWebhook(payload);
      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      console.log("RAW CONVERTER RESPONSE", response.text);
      const parsed = parseN8nAIResponse(response.text);
      console.log("PARSED CONVERTER RESPONSE", parsed);

      const output = getConvertedOutput(parsed);
      setConvertedQuery(output);

      if (!output) {
        setErrorMessage("The workflow returned no converted query.");
      }
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "The AI Agent took too long to respond. Please retry in a moment."
        : error?.message || "The converter request could not be completed right now.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!convertedQuery) {
      return;
    }

    try {
      await navigator.clipboard.writeText(convertedQuery);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setErrorMessage("Unable to copy the converted query.");
    }
  };

  const handleReset = () => {
    setSchemaInput("");
    setSourceQuery("");
    setConvertedQuery("");
    setErrorMessage("");
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-28 pt-8">
        <section className="hero-panel rounded-[24px] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Query Converter</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Query Converter</h1>
          <p className="mt-2 text-sm text-slate-300">Convert queries between SQL and MongoDB formats.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="hero-panel rounded-[24px] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-100">
                Source database
                <select
                  value={sourceDatabase}
                  onChange={(event) => setSourceDatabase(event.target.value)}
                  className="input-shell mt-2 w-full rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                >
                  {sourceDatabases.map((database) => (
                    <option key={database} value={database}>
                      {database}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-100">
                Target database
                <select
                  value={targetDatabase}
                  onChange={(event) => setTargetDatabase(event.target.value)}
                  className="input-shell mt-2 w-full rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                >
                  {targetDatabases.map((database) => (
                    <option key={database} value={database}>
                      {database}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold text-slate-100">
              Schema
              <textarea
                value={schemaInput}
                onChange={(event) => setSchemaInput(event.target.value)}
                placeholder="Optional schema hints to help the conversion workflow"
                className="input-shell mt-2 min-h-[140px] w-full rounded-xl px-4 py-3 font-mono text-sm text-slate-100 outline-none"
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-slate-100">
              Source query
              <textarea
                value={sourceQuery}
                onChange={(event) => setSourceQuery(event.target.value)}
                placeholder="Paste the query you want to convert"
                className="input-shell mt-2 min-h-[170px] w-full rounded-xl px-4 py-3 font-mono text-sm text-slate-100 outline-none"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConvert}
                disabled={loading}
                className="btn-primary rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Converting..." : "Convert"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </div>
            )}
          </section>

          <section className="hero-panel rounded-[24px] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Converted query</p>
                <h2 className="mt-2 text-lg font-semibold text-white">Output</h2>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!convertedQuery}
                className="btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy converted query"}
              </button>
            </div>

            <div className="code-block mt-4 p-5">
              <pre className="code-text m-0">
                {convertedQuery || "Convert a query to see the output here."}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default QueryConverterPage;
