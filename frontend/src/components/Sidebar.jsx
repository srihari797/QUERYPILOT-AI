import React from "react";

const Sidebar = ({ activeTab, onTabChange, tabs = [] }) => (
  <aside className="glass-panel rounded-[24px] p-4">
    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Workspace</p>
      <h2 className="mt-3 text-lg font-semibold text-white">QueryPilot AI</h2>
      <p className="mt-2 text-sm text-slate-300">Premium observability for SQL, MongoDB, and production-grade query tuning.</p>
    </div>

    <div className="mt-4 space-y-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
            activeTab === tab.key ? "tab-button-active" : "tab-button-inactive hover:border-cyan-400/40"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </aside>
);

export default Sidebar;
