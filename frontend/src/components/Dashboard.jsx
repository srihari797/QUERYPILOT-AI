import React from "react";
import Tabs from "./Tabs";
import OverviewTab from "../sections/OverviewTab";
import OptimizationTab from "../sections/OptimizationTab";
import RiskHeatmapTab from "../sections/RiskHeatmapTab";
import CostEstimatorTab from "../sections/CostEstimatorTab";
import ComplexityTab from "../sections/ComplexityTab";
import BenchmarkTab from "../sections/BenchmarkTab";
import LearningModeTab from "../sections/LearningModeTab";
import ReportTab from "../sections/ReportTab";
import DeploymentGuardTab from "../sections/DeploymentGuardTab";
import ExecutionSimulatorTab from "../sections/ExecutionSimulatorTab";

const dashboardTabs = [
  { key: "overview", label: "Overview" },
  { key: "optimization", label: "Optimization" },
  { key: "deployment", label: "Deployment Guard" },
  { key: "execution", label: "Execution Simulator" },
  { key: "risk", label: "Risk Heatmap" },
  { key: "cost", label: "Cost Estimator" },
  { key: "complexity", label: "Complexity" },
  { key: "benchmark", label: "Benchmark" },
  { key: "learning", label: "Learning Mode" },
  { key: "report", label: "Report" },
];

const Dashboard = ({ activeTab, onTabChange, result, onQuickAction, onDownloadReport, performanceChartData, riskChartData, showBenchmark, databaseType }) => (
  <div className="space-y-4">
    <Tabs activeTab={activeTab} onTabChange={onTabChange} tabs={dashboardTabs} />

    {activeTab === "overview" && <OverviewTab result={result} performanceChartData={performanceChartData} riskChartData={riskChartData} />}
    {activeTab === "optimization" && <OptimizationTab result={result} databaseType={databaseType} />}
    {activeTab === "deployment" && <DeploymentGuardTab result={result} />}
    {activeTab === "execution" && <ExecutionSimulatorTab result={result} />}
    {activeTab === "risk" && <RiskHeatmapTab result={result} />}
    {activeTab === "cost" && <CostEstimatorTab result={result} />}
    {activeTab === "complexity" && <ComplexityTab result={result} />}
    {activeTab === "benchmark" && <BenchmarkTab performanceChartData={performanceChartData} riskChartData={riskChartData} showBenchmark={showBenchmark} />}
    {activeTab === "learning" && <LearningModeTab result={result} onQuickAction={onQuickAction} />}
    {activeTab === "report" && <ReportTab result={result} onDownloadReport={onDownloadReport} />}
  </div>
);

export default Dashboard;
