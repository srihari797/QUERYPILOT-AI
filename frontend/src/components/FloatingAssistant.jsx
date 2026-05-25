import React from "react";
import { Loader2, MessageSquare, Send, X } from "lucide-react";

const FloatingAssistant = ({
  open,
  onToggle,
  messages,
  loading,
  inputValue,
  onInputChange,
  onSubmit,
  onClear,
  quickActions,
  onQuickAction,
}) => (
  <>
    <button
      type="button"
      onClick={onToggle}
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_20px_60px_rgba(34,211,238,0.35)]"
    >
      <MessageSquare className="h-6 w-6" />
    </button>

    {open && (
      <div className="assistant-panel fixed bottom-24 right-5 z-30 w-[min(92vw,380px)] rounded-[28px] shadow-[0_30px_80px_rgba(15,23,42,0.75)]">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">QueryPilot AI Assistant</p>
            <p className="text-xs text-slate-300">Ask about rewrites, indexes, and explanations.</p>
          </div>
          <button type="button" onClick={onToggle} className="rounded-full bg-slate-800 p-2 text-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onQuickAction(action)}
                className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100"
              >
                {action}
              </button>
            ))}
          </div>

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-2xl px-3 py-3 text-sm leading-6 ${
                message.role === "assistant" ? "bg-cyan-500/10 text-cyan-50" : "bg-slate-800 text-slate-100"
              }`}
            >
              <span className="whitespace-pre-wrap">{message.content}</span>
            </div>
          ))}

          {loading && (
            <div className="rounded-2xl bg-slate-800 px-3 py-3 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 px-4 py-2">
          <button type="button" onClick={onClear} className="text-xs font-semibold text-slate-300">
            Clear chat
          </button>
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-800 px-4 py-3">
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Ask the assistant"
              className="w-full rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            />
            <button type="submit" className="rounded-full bg-cyan-500 px-3 py-2 text-slate-950">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    )}
  </>
);

export default FloatingAssistant;
