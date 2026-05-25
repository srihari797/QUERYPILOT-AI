import React from "react";

const MetricCard = ({ label, value, accent = "text-cyan-100" }) => (
  <div className="glass-panel rounded-2xl px-4 py-4">
    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
    <p className={`mt-3 text-lg font-semibold ${accent}`}>{value}</p>
  </div>
);

export default MetricCard;
