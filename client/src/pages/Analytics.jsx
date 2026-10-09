import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import api from '../services/api';

function BarList({ title, items, nameFor, countFor }) {
  const max = Math.max(1, ...items.map(countFor));
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="mb-4 text-sm font-bold text-white">{title}</h2>{items.length ? <div className="space-y-3">{items.map((item, index) => <div key={`${nameFor(item)}-${index}`}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-slate-300">{nameFor(item)}</span><span className="font-semibold text-slate-400">{countFor(item)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div role="img" aria-label={`${nameFor(item)}: ${countFor(item)}`} className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(2, countFor(item) / max * 100)}%` }}/></div></div>)}</div> : <p className="text-xs text-slate-500">No tasks to report.</p>}</section>;
}

export default function Analytics() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/analytics', { params: projectId ? { projectId } : {} })
      .then(({ data: result }) => { if (active) { setData(result); setProjects(result.accessibleProjects || []); } })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load analytics.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  const summary = data?.summary;
  const cards = summary ? [
    ['Projects', summary.totalProjects], ['Tasks', summary.totalTasks], ['Completed', summary.completed], ['In progress', summary.inProgress], ['In review', summary.review], ['Overdue', summary.overdue], ['Completion', `${summary.completionPercentage}%`], ['Created in 30 days', summary.tasksCreatedLast30Days]
  ] : [];
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-labelledby="analytics-title">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Real project data</p><h1 id="analytics-title" className="mt-1 flex items-center gap-2 text-3xl font-extrabold text-white"><BarChart3 className="h-7 w-7 text-indigo-400"/>Analytics</h1><p className="mt-2 text-sm text-slate-400">Completion = completed tasks ÷ total tasks. Empty scopes show 0%.</p></div><label className="text-xs text-slate-400">Project filter<select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 block min-w-52 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"><option value="">All accessible projects</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.title}</option>)}</select></label></header>
    {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
    {loading ? <div className="flex justify-center py-20 text-indigo-300"><Loader2 className="animate-spin"/></div> : summary && <><section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{cards.map(([title, value]) => <article key={title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-400">{title}</p><p className="mt-1 text-2xl font-extrabold text-white">{value}</p></article>)}</section><div className="grid gap-4 lg:grid-cols-3"><BarList title="Tasks by status" items={data.distributions.status} nameFor={(item) => item._id} countFor={(item) => item.count}/><BarList title="Tasks by priority" items={data.distributions.priority} nameFor={(item) => item._id} countFor={(item) => item.count}/><BarList title="Tasks by assignee" items={data.distributions.assignee} nameFor={(item) => item.name} countFor={(item) => item.count}/></div><section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="mb-3 text-sm font-bold text-white">Project progress</h2>{data.projects.length ? <div className="space-y-4">{data.projects.map((project) => <div key={project._id}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate font-medium text-slate-200">{project.title} <span className="text-slate-500">· {project.status}</span></span><span className="text-slate-400">{project.completedTasks}/{project.totalTasks} tasks · {project.completionPercentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.completionPercentage}%` }}/></div></div>)}</div> : <p className="text-sm text-slate-500">No accessible projects.</p>}</section></>}
  </main>;
}
