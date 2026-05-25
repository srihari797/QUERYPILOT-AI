import React from "react";
import { safeString } from "../utils/formatters";

const ReportTab = ({ result = {}, onDownloadReport }) => {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Downloadable report</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Executive summary</h3>
        <p className="mt-4 text-sm leading-7 text-slate-100">{safeString(result.summary, "Generate an analysis to see the executive summary here.")}</p>
      </div>

      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Export</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Create a report</h3>
        <button type="button" onClick={onDownloadReport} className="btn-primary mt-4 rounded-xl px-4 py-3 text-sm font-semibold">
          Download report
        </button>
      </div>
    </div>
  );
};

export default ReportTab;
