import React from "react";
import MetricCard from "../components/MetricCard";
import RiskBadge from "../components/RiskBadge";
import { safeList, safeString, formatScore } from "../utils/formatters";

const OverviewTab = ({ result = {} }) => {
  const topProblems = safeList(result.problems).slice(0, 3);
  const topSuggestions = safeList(result.index_suggestions).slice(0, 3);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <div className="section-card rounded-[24px] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Summary</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Overview</h3>
          </div>
          <span className="metric-pill px-3 py-1 text-xs font-semibold">{safeString(result.mode, "analyze_query")}</span>
        </div>

        <div className="mt-4 rounded-[20px] border border-slate-800 bg-slate-950/55 p-4">
          <p className="text-sm text-slate-300">{safeString(result.summary, "Run an analysis to see the AI summary.")}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricCard label="Latency" value={safeString(result.performance_prediction?.after?.estimated_latency, "N/A")} />
          <MetricCard label="Improvement" value={safeString(result.performance_prediction?.improvement_percentage, "0%") } accent="text-emerald-300" />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <RiskBadge label="Risk before" severity={formatScore(result.risk_score_before)} />
          <RiskBadge label="Risk after" severity={formatScore(result.risk_score_after)} />
        </div>
      </div>

      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Action focus</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Recommended actions</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
            <p className="text-sm font-semibold text-white">Top issues</p>
            <div className="mt-3 space-y-2">
              {topProblems.length ? topProblems.map((item, index) => <p key={`${item}-${index}`} className="text-sm text-slate-100">• {safeString(item)}</p>) : <p className="text-sm text-slate-300">No issue list yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
            <p className="text-sm font-semibold text-white">Index suggestions</p>
            <div className="mt-3 space-y-2">
              {topSuggestions.length ? topSuggestions.map((item, index) => <p key={`${item}-${index}`} className="text-sm text-slate-100">• {safeString(item)}</p>) : <p className="text-sm text-slate-300">No suggestions returned.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
