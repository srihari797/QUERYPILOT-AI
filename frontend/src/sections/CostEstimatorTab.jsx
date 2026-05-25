import React from "react";
import { safeString } from "../utils/formatters";

const CostEstimatorTab = ({ result = {} }) => {
  const estimatedSavings = safeString(result.cost_estimate?.estimated_savings, "$0");
  const currentCost = safeString(result.cost_estimate?.current_cost, "$0");
  const optimizedCost = safeString(result.cost_estimate?.optimized_cost, "$0");

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Cost forecast</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Estimated savings</h3>
        <div className="mt-4 text-3xl font-bold text-emerald-300">{estimatedSavings}</div>
        <div className="mt-4 space-y-3 text-sm text-slate-100">
          <p>Current cost: {currentCost}</p>
          <p>Optimized cost: {optimizedCost}</p>
        </div>
      </div>

      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Guidance</p>
        <h3 className="mt-2 text-lg font-semibold text-white">How to reduce spend</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-100">
          <li>• Add covering indexes for high-frequency filters.</li>
          <li>• Remove unnecessary joins and expensive scans.</li>
          <li>• Reuse prepared statements and cache repeated reads.</li>
        </ul>
      </div>
    </div>
  );
};

export default CostEstimatorTab;
