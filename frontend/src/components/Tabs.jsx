import React from "react";

const Tabs = ({ activeTab, onTabChange, tabs = [] }) => (
  <div className="flex flex-wrap gap-2">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        onClick={() => onTabChange(tab.key)}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          activeTab === tab.key ? "tab-button-active" : "tab-button-inactive"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;
