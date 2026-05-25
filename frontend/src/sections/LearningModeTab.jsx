import React from "react";
import { safeString } from "../utils/formatters";

const LearningModeTab = ({ result = {}, onQuickAction }) => {
  const explanation = safeString(result.explanation, "Learn how the optimizer thinks by reviewing the current rewrite summary.");

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Learning mode</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Explain the reasoning behind the rewrite</h3>
        <p className="mt-4 text-sm leading-7 text-slate-100">{explanation}</p>
      </div>

      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Quick prompts</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Explain the index suggestion",
            "Why is this query slow?",
            "Show a safer rewrite",
          ].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningModeTab;
