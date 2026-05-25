import React from "react";
import RiskBadge from "../components/RiskBadge";
import { safeList, safeString } from "../utils/formatters";

const RiskHeatmapTab = ({ result = {} }) => {
  const issues = safeList(result.problems);
  const explanation = safeString(result.explanation, "No explanation available yet.");

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Risk map</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Issue severity view</h3>
        <div className="mt-4 space-y-3">
          {issues.length ? issues.map((issue, index) => (
            <div key={`${issue}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-100">{safeString(issue)}</p>
                <RiskBadge label="High" severity="high" />
              </div>
            </div>
          )) : (
            <p className="text-sm text-slate-300">No risk findings are available yet. Run analysis to populate the heatmap.</p>
          )}
        </div>
      </div>

      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Narrative</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Contextual insight</h3>
        <p className="mt-4 text-sm leading-7 text-slate-100">{explanation}</p>
      </div>
    </div>
  );
};

export default RiskHeatmapTab;
