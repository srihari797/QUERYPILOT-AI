export const generateReportText = (reportData = {}) => {
  const databaseType = reportData.databaseType || "Unknown";
  const originalQuery = reportData.originalQuery || "(empty)";
  const optimizedQuery = reportData.optimizedQuery || reportData.generatedQuery || "(empty)";
  const problems = Array.isArray(reportData.problems) && reportData.problems.length ? reportData.problems.join("\n- ") : "None";
  const indexSuggestions = Array.isArray(reportData.indexSuggestions) && reportData.indexSuggestions.length ? reportData.indexSuggestions.join("\n- ") : "None";
  const performance = reportData.performancePrediction || {};
  const beginner = reportData.beginnerExplanation || "No beginner explanation returned.";
  const expert = reportData.expertExplanation || "No technical explanation returned.";
  const trace = Array.isArray(reportData.agentTrace) && reportData.agentTrace.length ? reportData.agentTrace.join("\n- ") : "None";

  return `# QueryPilot AI Report

## Database
- ${databaseType}

## Original Query
${originalQuery}

## Optimized Query
${optimizedQuery}

## Problems
- ${problems}

## Index Suggestions
- ${indexSuggestions}

## Performance Prediction
- Before latency: ${performance?.before?.estimated_latency ?? "N/A"}
- After latency: ${performance?.after?.estimated_latency ?? "N/A"}
- Improvement: ${performance?.improvement_percentage ?? "N/A"}

## Beginner Explanation
${beginner}

## Technical Explanation
${expert}

## Agent Trace
- ${trace}
`;
};

export const downloadReport = (reportData = {}, fileName = "querypilot-report.md") => {
  const text = generateReportText(reportData);
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
