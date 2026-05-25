import React from "react";
import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

const BenchmarkTab = ({ performanceChartData = [], riskChartData = [], showBenchmark }) => {
  if (!showBenchmark) {
    return (
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Benchmark</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Enable benchmark series to compare before and after metrics.</h3>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Performance</p>
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip />
              <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Risk chart</p>
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkTab;
