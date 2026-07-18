"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Check, ChevronRight, Download, Eye, EyeOff, FileText, KeyRound, LoaderCircle, Send, ShieldCheck, User } from "lucide-react";
import { useFormAgent } from "@/hooks/useFormAgent";
import { type FormSectionKey } from "@/lib/form-schema";

const steps: { key: FormSectionKey; label: string; hint: string }[] = [
  { key: "audience", label: "Audience", hint: "Internal or public" },
  { key: "disclosure", label: "AI disclosure", hint: "User notification" },
  { key: "systemOutputs", label: "System outputs", hint: "Scores, drafts, actions" },
  { key: "rightsSafety", label: "Rights & safety", hint: "Impacting uses" },
  { key: "dataSources", label: "Data sources", hint: "Classification & regulation" },
  { key: "riskManagement", label: "Risk management", hint: "Privacy, ethics & testing" },
  { key: "technicalDetails", label: "Technical details", hint: "Model & system card" },
  { key: "humanInTheLoop", label: "Human in the loop", hint: "Review & controls" },
  { key: "definingSuccess", label: "Defining success", hint: "Metrics & measurement" },
  { key: "processingCategories", label: "Processing categories", hint: "AI capabilities" },
  { key: "killSwitch", label: "Kill switch", hint: "Disable capability" },
];

export function FormBuilderView() {
  const { formState, messages, activeSection, setActiveSection, isLoading, error, sendMessage, validation, riskFlags } = useFormAgent();
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const completed = steps.filter(step => formState[step.key].status === "complete").length;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    const value = input;
    setInput("");
    void sendMessage(value, apiKey);
  }

  function exportJson() {
    if (!validation.isValid) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(validation.data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ai-use-form.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(30,55,90,.12)] lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-slate-200 bg-[#f8fafc] lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-[#174ea6] text-white"><FileText size={21} /></div>
              <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#174ea6]">EIS governance</p><h1 className="text-lg font-bold">AI Use Form</h1></div>
            </div>
            <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Application progress</span><span className="text-slate-500">{completed}/11</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#174ea6] transition-all" style={{ width: `${completed / 11 * 100}%` }} /></div>
            <p className="mt-3 text-xs leading-5 text-slate-500">All sections must be completed before the form can be exported.</p>
          </div>
          <nav className="grid gap-1 p-3 sm:grid-cols-2 lg:grid-cols-1" aria-label="Form sections">
            {steps.map((step, index) => {
              const status = formState[step.key].status;
              const active = activeSection === step.key;
              return <button key={step.key} onClick={() => setActiveSection(step.key)} className={`group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-blue-200 bg-white shadow-sm" : "border-transparent hover:bg-white"}`}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${status === "complete" ? "border-emerald-600 bg-emerald-600 text-white" : status === "in_progress" ? "border-[#174ea6] bg-blue-50 text-[#174ea6]" : "border-slate-300 bg-white text-slate-400"}`}>{status === "complete" ? <Check size={15} /> : index + 1}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{step.label}</span><span className="block truncate text-xs text-slate-500">{step.hint}</span></span>
                <ChevronRight size={15} className={active ? "text-[#174ea6]" : "text-slate-300"} />
              </button>;
            })}
          </nav>
        </aside>

        <section className="flex min-h-[720px] flex-col bg-white">
          <header className="border-b border-slate-200 px-5 py-4 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3"><div className="relative grid size-10 place-items-center rounded-full bg-blue-50 text-[#174ea6]"><Bot size={21} /><span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" /></div><div><p className="font-bold">Form interview agent</p><p className="text-xs text-slate-500">Guided completion • Responses saved to form state</p></div></div>
              <button onClick={exportJson} disabled={!validation.isValid} className="flex items-center gap-2 rounded-xl bg-[#152238] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#223553] disabled:opacity-35"><Download size={16} /> Export JSON</button>
            </div>
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <KeyRound size={17} className="shrink-0 text-[#174ea6]" />
                <label htmlFor="gemini-api-key" className="shrink-0 text-sm font-semibold text-slate-700">Gemini API key</label>
                <div className="relative min-w-0 flex-1">
                  <input
                    id="gemini-api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={event => setApiKey(event.target.value)}
                    placeholder="Paste your key to start"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-3 pr-10 text-sm outline-none focus:border-[#174ea6] focus:ring-2 focus:ring-blue-100"
                  />
                  <button type="button" onClick={() => setShowApiKey(value => !value)} aria-label={showApiKey ? "Hide API key" : "Show API key"} className="absolute right-1 top-1 grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 sm:max-w-48">Used for this tab only. Never saved with the form.</p>
            </div>
          </header>

          {riskFlags.isHigherRisk && <div role="alert" className="border-b border-amber-300 bg-amber-50 px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-4xl gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={21} /><div><p className="font-bold text-amber-950">Higher-Risk AI Use Detected</p><p className="mt-0.5 text-sm text-amber-900">Please consult the Privacy and AI program at EIS for further discussion.</p><p className="mt-1 text-xs text-amber-700">Trigger: {riskFlags.reasons.join(" • ")}</p></div></div></div>}

          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,#f8fbff,transparent_45%)] px-5 py-8 sm:px-8">
            <div className="mx-auto max-w-4xl space-y-6" aria-live="polite">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-slate-400"><ShieldCheck size={15} /> Section {steps.findIndex(step => step.key === activeSection) + 1}: {steps.find(step => step.key === activeSection)?.label}</div>
              {messages.map(item => <div key={item.id} className={`flex gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                {item.role === "agent" && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#174ea6] text-white"><Bot size={16} /></span>}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${item.role === "user" ? "rounded-br-md bg-[#174ea6] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`}>{item.content}</div>
                {item.role === "user" && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-600"><User size={16} /></span>}
              </div>)}
              {isLoading && <div className="flex items-center gap-3 text-sm text-slate-500"><span className="grid size-8 place-items-center rounded-full bg-blue-50 text-[#174ea6]"><LoaderCircle className="animate-spin" size={16} /></span>Reviewing your answer and updating the form…</div>}
              <div ref={endRef} />
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white p-4 sm:p-6">
            <form onSubmit={submit} className="mx-auto max-w-4xl">
              {error && <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex items-end gap-2 rounded-2xl border border-slate-300 p-2 shadow-sm transition focus-within:border-[#174ea6] focus-within:ring-4 focus-within:ring-blue-50">
                <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={2} disabled={isLoading || !apiKey.trim()} placeholder={apiKey.trim() ? "Answer the agent’s question…" : "Enter a Gemini API key above to begin…"} className="min-h-14 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-slate-400" />
                <button type="submit" disabled={isLoading || !apiKey.trim() || !input.trim()} aria-label="Send response" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#174ea6] text-white transition hover:bg-[#123d82] disabled:opacity-35"><Send size={18} /></button>
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">Enter to send • Shift+Enter for a new line • Avoid including unnecessary sensitive data</p>
            </form>
          </footer>
        </section>
      </div>
    </main>
  );
}
