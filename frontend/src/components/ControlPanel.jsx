import React from "react";
import { BrainCog, Loader2, RotateCcw, Sparkles } from "lucide-react";

const ControlPanel = ({
  query,
  schemaInput,
  naturalLanguageInput,
  databaseType,
  onQueryChange,
  onSchemaChange,
  onNaturalLanguageChange,
  onDatabaseChange,
  onAnalyze,
  onGenerate,
  onConvert,
  onClear,
  loading,
  statusMessage,
  errorMessage,
  queryLabel,
  schemaLabel,
  queryPlaceholder,
  schemaPlaceholder,
}) => (
  <section className="hero-panel rounded-[24px] p-5">
    <div className="mb-4">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Control center</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Analyze, generate, and convert query plans</h2>
      <p className="mt-1 text-sm text-slate-300">QueryPilot AI keeps the n8n workflow hidden while surfacing premium optimization insight.</p>
    </div>

    <label className="block text-sm font-semibold text-slate-100">
      {queryLabel}
      <textarea
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={queryPlaceholder}
        className="input-shell mt-2 min-h-[150px] w-full rounded-xl px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400"
      />
    </label>

    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-100">
        Database type
        <select
          value={databaseType}
          onChange={(event) => onDatabaseChange(event.target.value)}
          className="input-shell mt-2 w-full rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
        >
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="sqlserver">SQL Server</option>
          <option value="mongodb">MongoDB</option>
          <option value="sqlite">SQLite</option>
          <option value="oracle">Oracle</option>
        </select>
      </label>

      <label className="block text-sm font-semibold text-slate-100">
        {schemaLabel}
        <textarea
          value={schemaInput}
          onChange={(event) => onSchemaChange(event.target.value)}
          placeholder={schemaPlaceholder}
          className="input-shell mt-2 min-h-[140px] w-full rounded-xl px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        />
      </label>
    </div>

    <label className="mt-4 block text-sm font-semibold text-slate-100">
      Natural language request
      <textarea
        value={naturalLanguageInput}
        onChange={(event) => onNaturalLanguageChange(event.target.value)}
        placeholder="Explain the rewrite, suggest indexes, or describe the performance issue..."
        className="input-shell mt-2 min-h-[110px] w-full rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
      />
    </label>

    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={onAnalyze} disabled={loading} className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCog className="h-4 w-4" />}
        Analyze
      </button>
      <button type="button" onClick={onGenerate} disabled={loading} className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60">
        <Sparkles className="h-4 w-4" />
        Generate
      </button>
      <button type="button" onClick={onConvert} className="btn-secondary rounded-xl px-4 py-3 text-sm font-semibold">
        Convert SQL ↔ MongoDB
      </button>
      <button type="button" onClick={onClear} className="btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
        <RotateCcw className="h-4 w-4" />
        Clear inputs
      </button>
    </div>

    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-200">
      <span className="font-semibold text-cyan-200">Status:</span> {statusMessage}
    </div>

    {errorMessage && (
      <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">
        {errorMessage}
      </div>
    )}
  </section>
);

export default ControlPanel;
