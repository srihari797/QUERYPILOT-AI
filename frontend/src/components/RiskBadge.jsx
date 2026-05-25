import React from "react";

const RiskBadge = ({ label, severity }) => {
  const palette = {
    Critical: "bg-red-950/80 text-red-100 border-red-500/50",
    High: "bg-amber-950/80 text-amber-100 border-amber-500/50",
    Medium: "bg-emerald-950/80 text-emerald-100 border-emerald-500/50",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-sm ${palette[severity] || palette.Medium}`}>
      {label}: {severity}
    </span>
  );
};

export default RiskBadge;
