import React, { useEffect, useState } from 'react';
import { Bot, Copy, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';

const OPTIONS = [
  ['summary', 'Summarize project progress'], ['breakdown', 'Break down project work'], ['priorities', 'Suggest priorities and sequence'], ['status-report', 'Draft a status report']
];

export function ProjectAssistant({ projectId }) {
  const [operation, setOperation] = useState('summary');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { setPrompt(''); setAnswer(''); setError(''); setCopied(false); }, [projectId]);

  const ask = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setAnswer('');
    try { const { data } = await api.post(`/ai/projects/${projectId}/assistant`, { operation, prompt }); setAnswer(data.answer); }
    catch (err) { setError(err.response?.data?.message || 'Assistant request failed.'); }
    finally { setLoading(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(answer); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setError('Could not copy text to clipboard.'); } };

  return <section className="rounded-2xl border border-violet-900/60 bg-gradient-to-br from-slate-900 to-violet-950/20 p-5" aria-labelledby="assistant-title">
    <div className="mb-4 flex items-start gap-3"><div className="rounded-xl bg-violet-950 p-2 text-violet-300"><Bot size={20}/></div><div><h2 id="assistant-title" className="font-bold text-white">Project assistant</h2><p className="mt-1 text-xs text-slate-400">Suggestions use this project’s authorized task data. Nothing changes automatically.</p></div></div>
    <form onSubmit={ask} className="space-y-3"><label className="block text-xs font-medium text-slate-300">What should the assistant help with?<select value={operation} onChange={(e) => setOperation(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">{OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-xs font-medium text-slate-300">Additional instructions (optional)<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={2000} rows={2} placeholder="Focus on blockers, a time range, or a report audience…" className="mt-1.5 block w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"/></label><div className="flex items-center justify-between"><span className="text-[11px] text-slate-500">{prompt.length}/2000 · Limit 5 requests/min</span><button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{loading ? <Loader2 size={15} className="animate-spin"/> : <Sparkles size={15}/>}Generate suggestions</button></div></form>
    {error && <p role="alert" className="mt-3 rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-200">{error}</p>}
    {answer && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-4"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Suggested draft</p><button type="button" onClick={copy} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"><Copy size={13}/>{copied ? 'Copied' : 'Copy'}</button></div><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{answer}</p></div>}
  </section>;
}
