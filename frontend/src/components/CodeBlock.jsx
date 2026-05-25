import React, { useState } from "react";
import { formatMongoQuery, formatSQLQuery } from "../utils/formatters";

const CodeBlock = ({ value, code, databaseType = "mysql", label = "Query", queryTypeLabel }) => {
  const [copied, setCopied] = useState(false);
  const content = value ?? code ?? "";
  const formattedValue = databaseType === "mongodb" ? formatMongoQuery(content) : formatSQLQuery(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // ignore clipboard errors
    }
  };

  return (
    <div className="query-card rounded-[24px] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">{label}</p>
          <p className="mt-2 text-sm text-slate-300">{queryTypeLabel || "Professional query view with syntax-friendly formatting."}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold"
        >
          {copied ? "Copied!" : "Copy query"}
        </button>
      </div>

      <div className="code-block mt-4 p-5">
        <pre className="code-text m-0">{formattedValue || "No query returned."}</pre>
      </div>
    </div>
  );
};

export default CodeBlock;
