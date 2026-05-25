import React from "react";
import CodeBlock from "../components/CodeBlock";
import { safeString } from "../utils/formatters";

const OptimizationTab = ({ result = {}, databaseType }) => {
  const optimizedQuery = safeString(result.optimized_query, "No optimized query was returned yet.");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Query rewrite</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Optimized SQL / NoSQL output</h3>
        <div className="mt-4">
          <CodeBlock language={databaseType === "mongodb" ? "javascript" : "sql"} code={optimizedQuery} queryTypeLabel={databaseType} />
        </div>
      </div>

      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Takeaways</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Highlights</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-100">
          <p>• {safeString(result.explanation, "Use the assistant or analyze action to generate a rewrite explanation.")}</p>
          <p>• {safeString(result.query_type, "Query type not provided.")}</p>
          <p>• {safeString(result.database_type, databaseType)}</p>
        </div>
      </div>
    </div>
  );
};

export default OptimizationTab;
