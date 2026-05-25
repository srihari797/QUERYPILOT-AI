import React from "react";
import CodeBlock from "../components/CodeBlock";
import { safeList, safeString } from "../utils/formatters";

const getStatusStyles = (status = "") => {
  const normalized = safeString(status, "Risky").toLowerCase();

  if (normalized === "safe") {
    return "border-emerald-500/50 bg-emerald-950/70 text-emerald-100";
  }

  if (normalized === "caution") {
    return "border-amber-500/50 bg-amber-950/70 text-amber-100";
  }

  return "border-red-500/50 bg-red-950/70 text-red-100";
};

const DeploymentGuardTab = ({ result = {} }) => {
  const deploymentGuard = result?.deployment_guard || {};

  if (!deploymentGuard || Object.keys(deploymentGuard).length === 0) {
    return (
      <div className="section-card rounded-[24px] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Deployment Guard</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Deployment readiness details were not returned by the AI Agent.</h3>
      </div>
    );
  }

  const status = safeString(deploymentGuard?.deployment_status, "Risky");
  const confidenceScore = safeString(deploymentGuard?.confidence_score, "N/A");
  const breakingChangeRisk = safeString(deploymentGuard?.breaking_change_risk, "N/A");
  const dataCorrectnessRisk = safeString(deploymentGuard?.data_correctness_risk, "N/A");
  const migrationScript = safeString(deploymentGuard?.index_migration_script, "");
  const rollbackPlan = safeString(deploymentGuard?.rollback_plan, "");
  const testCases = safeList(deploymentGuard?.test_cases);
  const preDeploymentChecklist = safeList(deploymentGuard?.pre_deployment_checklist);
  const postDeploymentMonitoring = safeList(deploymentGuard?.post_deployment_monitoring);
  const tradeoffs = safeList(deploymentGuard?.tradeoffs);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <section className="section-card rounded-[24px] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Deployment Guard</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Production readiness</h3>
              <p className="mt-2 text-sm text-slate-300">This section highlights whether the optimized query is safe to deploy in production.</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusStyles(status)}`}>
              {status}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Confidence score</p>
              <p className="mt-2 text-lg font-semibold text-white">{confidenceScore}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Breaking change risk</p>
              <p className="mt-2 text-lg font-semibold text-white">{breakingChangeRisk}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Data correctness risk</p>
              <p className="mt-2 text-lg font-semibold text-white">{dataCorrectnessRisk}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Readiness note</p>
              <p className="mt-2 text-sm text-slate-200">{safeString(deploymentGuard?.summary || deploymentGuard?.notes, "No additional readiness note was returned.")}</p>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[24px] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Migration script</p>
          <div className="mt-3">
            <CodeBlock code={migrationScript} label="Index migration script" />
          </div>
        </section>

        <section className="section-card rounded-[24px] p-5">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Rollback plan</p>
          <div className="mt-3">
            <CodeBlock code={rollbackPlan} label="Rollback plan" />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="section-card rounded-[24px] p-5">
          <h3 className="text-lg font-semibold text-white">Test cases</h3>
          <div className="mt-4 space-y-3">
            {testCases.length > 0 ? (
              testCases.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-100">
                  {safeString(item)}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No test cases were returned by the AI Agent.</p>
            )}
          </div>
        </section>

        <section className="section-card rounded-[24px] p-5">
          <h3 className="text-lg font-semibold text-white">Pre-deployment checklist</h3>
          <div className="mt-4 space-y-3">
            {preDeploymentChecklist.length > 0 ? (
              preDeploymentChecklist.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-100">
                  {safeString(item)}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No pre-deployment checklist items were returned.</p>
            )}
          </div>
        </section>

        <section className="section-card rounded-[24px] p-5">
          <h3 className="text-lg font-semibold text-white">Post-deployment monitoring</h3>
          <div className="mt-4 space-y-3">
            {postDeploymentMonitoring.length > 0 ? (
              postDeploymentMonitoring.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-100">
                  {safeString(item)}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No post-deployment monitoring items were returned.</p>
            )}
          </div>
        </section>

        <section className="section-card rounded-[24px] p-5">
          <h3 className="text-lg font-semibold text-white">Tradeoffs</h3>
          <div className="mt-4 space-y-3">
            {tradeoffs.length > 0 ? (
              tradeoffs.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3 text-sm text-slate-100">
                  {safeString(item)}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">No tradeoffs were returned by the AI Agent.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DeploymentGuardTab;
