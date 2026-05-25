import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getMetricNumber, safeString } from "../utils/formatters";

const SIMULATION_SCALES = [
  { label: "1K rows", rowCount: 1000 },
  { label: "100K rows", rowCount: 100000 },
  { label: "1M rows", rowCount: 1000000 },
  { label: "10M rows", rowCount: 10000000 },
  { label: "100M rows", rowCount: 100000000 },
];

const getRiskLevel = (value) => {
  const normalized = safeString(value, "Medium").toLowerCase();

  if (normalized.includes("critical") || normalized.includes("high")) {
    return "High";
  }

  if (normalized.includes("medium") || normalized.includes("moderate")) {
    return "Medium";
  }

  return "Low";
};

const getRiskWeight = (value) => {
  const level = getRiskLevel(value);
  if (level === "High") return 80;
  if (level === "Medium") return 55;
  return 25;
};

const normalizeScaleData = (scale = {}, fallback = {}) => ({
  label: safeString(scale.label || fallback.label, fallback.label || "1K rows"),
  before_latency_ms: getMetricNumber(scale.before_latency_ms ?? scale.beforeLatency ?? fallback.before_latency_ms),
  after_latency_ms: getMetricNumber(scale.after_latency_ms ?? scale.afterLatency ?? fallback.after_latency_ms),
  before_rows_scanned: getMetricNumber(scale.before_rows_scanned ?? scale.beforeRows ?? fallback.before_rows_scanned),
  after_rows_scanned: getMetricNumber(scale.after_rows_scanned ?? scale.afterRows ?? fallback.after_rows_scanned),
  risk: safeString(scale.risk || fallback.risk, fallback.risk || "Medium"),
});

const buildFallbackSimulation = (result = {}) => {
  const performance = result?.performance_prediction || {};
  const chartMetrics = result?.chart_metrics || {};

  const baselineBeforeLatency = getMetricNumber(
    chartMetrics.before_latency_ms ??
      chartMetrics.before_latency ??
      performance.before?.estimated_latency ??
      80
  );
  const baselineAfterLatency = getMetricNumber(
    chartMetrics.after_latency_ms ??
      chartMetrics.after_latency ??
      performance.after?.estimated_latency ??
      Math.max(10, Math.round(baselineBeforeLatency * 0.28))
  );
  const baselineBeforeRows = getMetricNumber(
    chartMetrics.before_rows_scanned ??
      chartMetrics.before_rows ??
      performance.before?.rows_scanned ??
      1000
  );
  const baselineAfterRows = getMetricNumber(
    chartMetrics.after_rows_scanned ??
      chartMetrics.after_rows ??
      performance.after?.rows_scanned ??
      Math.max(25, Math.round(baselineBeforeRows * 0.08))
  );

  const riskWeight = Math.max(getRiskWeight(result?.risk_score_before), getRiskWeight(result?.risk_score_after));
  const riskMultiplier = 1 + riskWeight / 120;

  return {
    scales: SIMULATION_SCALES.map((scale) => {
      const rowMultiplier = scale.rowCount / 1000;
      const beforeLatency = Math.max(8, Math.round(baselineBeforeLatency * rowMultiplier * riskMultiplier));
      const afterLatency = Math.max(5, Math.round(baselineAfterLatency * rowMultiplier * 0.85));
      const beforeRows = Math.max(scale.rowCount, Math.round(baselineBeforeRows * rowMultiplier));
      const afterRows = Math.max(10, Math.round(baselineAfterRows * rowMultiplier));
      const risk = beforeLatency > 4000 || beforeRows > 5000000 ? "High" : riskWeight >= 55 ? "Medium" : "Low";

      return {
        label: scale.label,
        before_latency_ms: beforeLatency,
        after_latency_ms: afterLatency,
        before_rows_scanned: beforeRows,
        after_rows_scanned: afterRows,
        risk,
      };
    }),
    scalability_summary:
      safeString(
        result?.summary,
        "The simulator uses the current performance profile to estimate how latency and scan volume grow as data volume increases."
      ),
    bottleneck_growth:
      safeString(
        result?.performance_prediction?.after?.estimated_latency,
        "Bottlenecks rise most sharply at larger row counts when the optimized plan still needs to scan or sort a large working set."
      ),
    recommended_scale_limit: riskWeight >= 80 ? "100K rows" : "1M rows",
  };
};

const ExecutionSimulatorTab = ({ result = {} }) => {
  const mode = safeString(result?.mode, "analyze_query");

  const simulation = useMemo(() => {
    const rawSimulation = result?.execution_simulation;

    if (rawSimulation && typeof rawSimulation === "object") {
      const rawScales = Array.isArray(rawSimulation.scales) && rawSimulation.scales.length > 0
        ? rawSimulation.scales
        : [];

      const fallback = buildFallbackSimulation(result);

      return {
        scales: rawScales.length > 0
          ? rawScales.map((scale, index) => normalizeScaleData(scale, fallback.scales[index] || {}))
          : fallback.scales,
        scalability_summary: safeString(rawSimulation.scalability_summary, fallback.scalability_summary),
        bottleneck_growth: safeString(rawSimulation.bottleneck_growth, fallback.bottleneck_growth),
        recommended_scale_limit: safeString(rawSimulation.recommended_scale_limit, fallback.recommended_scale_limit),
      };
    }

    return buildFallbackSimulation(result);
  }, [result]);

  const [selectedScale, setSelectedScale] = useState(simulation.scales[0]?.label || "1K rows");

  useEffect(() => {
    setSelectedScale(simulation.scales[0]?.label || "1K rows");
  }, [simulation]);

  const selectedSimulation = useMemo(() => {
    return simulation.scales.find((scale) => scale.label === selectedScale) || simulation.scales[0] || {
      label: "1K rows",
      before_latency_ms: 0,
      after_latency_ms: 0,
      before_rows_scanned: 0,
      after_rows_scanned: 0,
      risk: "Low",
    };
  }, [selectedScale, simulation]);

  const chartData = [
    {
      name: "Latency",
      Before: selectedSimulation.before_latency_ms,
      After: selectedSimulation.after_latency_ms,
    },
    {
      name: "Rows scanned",
      Before: selectedSimulation.before_rows_scanned,
      After: selectedSimulation.after_rows_scanned,
    },
  ];

  if (mode === "generate_query") {
    return (
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Execution Simulator</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Execution simulation is available only when an original query is provided.</h3>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <section className="section-card rounded-[24px] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Execution Simulator</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Scale-aware performance simulation</h3>
          <p className="mt-2 text-sm text-slate-300">Pick a data size to inspect before vs after latency and rows scanned across the current optimization plan.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SIMULATION_SCALES.map((scale) => (
              <label
                key={scale.label}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                  selectedScale === scale.label
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-slate-800 bg-slate-950/55"
                }`}
              >
                <input
                  type="radio"
                  name="execution-scale"
                  checked={selectedScale === scale.label}
                  onChange={() => setSelectedScale(scale.label)}
                  className="accent-cyan-400"
                />
                <span className="text-sm font-semibold text-slate-100">{scale.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estimated latency before</p>
              <p className="mt-2 text-2xl font-semibold text-white">{selectedSimulation.before_latency_ms} ms</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estimated latency after</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{selectedSimulation.after_latency_ms} ms</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rows scanned before</p>
              <p className="mt-2 text-2xl font-semibold text-white">{selectedSimulation.before_rows_scanned.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rows scanned after</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{selectedSimulation.after_rows_scanned.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scalability risk</p>
              <p className="mt-2 text-lg font-semibold text-white">{selectedSimulation.risk}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recommended scale limit</p>
              <p className="mt-2 text-lg font-semibold text-cyan-200">{safeString(simulation.recommended_scale_limit, "1M rows")}</p>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[24px] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Bottleneck growth</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Growth explanation</h3>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            {safeString(simulation.bottleneck_growth, "Higher row counts increase scan pressure and CPU work. The optimized path should keep the growth curve flatter than the original baseline.")}
          </p>
        </section>
      </div>

      <div className="space-y-6">
        <section className="section-card rounded-[24px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Before vs after</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Simulation comparison</h3>
            </div>
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              {selectedSimulation.label}
            </span>
          </div>

          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip
                  cursor={{ fill: "rgba(34, 211, 238, 0.06)" }}
                  contentStyle={{ backgroundColor: "#020617", borderRadius: 12, border: "1px solid #334155" }}
                />
                <Bar dataKey="Before" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="After" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="section-card rounded-[24px] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Scalability summary</p>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            {safeString(simulation.scalability_summary, "The current query remains stable across lower scales, but larger data volumes continue to increase scan pressure and latency.")}
          </p>
        </section>
      </div>
    </div>
  );
};

export default ExecutionSimulatorTab;
