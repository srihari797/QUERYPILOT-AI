import React from "react";

const LoadingState = ({ message = "Loading..." }) => (
  <div className="glass-panel rounded-2xl px-6 py-8 text-center text-slate-100">
    <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
    <p className="text-sm text-slate-200">{message}</p>
  </div>
);

export default LoadingState;
