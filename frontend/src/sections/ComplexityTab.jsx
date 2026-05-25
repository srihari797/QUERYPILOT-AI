import React from "react";
import MetricCard from "../components/MetricCard";
import { safeString } from "../utils/formatters";

const ComplexityTab = ({ result = {} }) => {
  const complexityScore = safeString(result.complexity_score, "Medium");
  const estimatedRows = safeString(result.estimated_rows, "N/A");

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <MetricCard label="Complexity" value={complexityScore} />
      <MetricCard label="Estimated rows" value={estimatedRows} />
      <MetricCard label="Suggested strategy" value={safeString(result.strategy, "Index-first approach")} />
    </div>
  );
};

export default ComplexityTab;
