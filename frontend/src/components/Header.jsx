import React from "react";
import { Database, Sparkles } from "lucide-react";

const Header = ({ loading, onDownloadReport, onOpenAssistant }) => (
  <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-slate-950/85 backdrop-blur">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-2 shadow-lg">
          <Database className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">QueryPilot AI</p>
          <h1 className="text-2xl font-bold text-white">Agentic Database Query Optimizer</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="metric-pill px-4 py-2 text-sm">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? "Analyzing" : "Ready"}
          </span>
        </div>
        <button type="button" onClick={onDownloadReport} className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold">
          Export report
        </button>
        <button type="button" onClick={onOpenAssistant} className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
          Open assistant
        </button>
      </div>
    </div>
  </header>
);

export default Header;
