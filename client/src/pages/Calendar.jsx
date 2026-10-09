import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const keyFor = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function CalendarPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let active = true;
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    setLoading(true); setError('');
    api.get('/calendar', { params: { from: from.toISOString(), to: to.toISOString() } })
      .then(({ data }) => { if (active) setTasks(data.tasks || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load calendar tasks.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month]);

  const byDate = useMemo(() => tasks.reduce((map, task) => { const key = keyFor(new Date(task.dueDate)); (map[key] ||= []).push(task); return map; }, {}), [tasks]);
  const firstWeekday = (month.getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: dayCount }, (_, index) => index + 1)];
  const selectedTasks = selectedDay ? byDate[keyFor(selectedDay)] || [] : [];
  const shiftMonth = (delta) => { setSelectedDay(null); setMonth((value) => new Date(value.getFullYear(), value.getMonth() + delta, 1)); };

  return <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6" aria-labelledby="calendar-title">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Plan the work</p><h1 id="calendar-title" className="mt-1 text-3xl font-extrabold text-white">Task calendar</h1><p className="mt-2 text-sm text-slate-400">Due dates from projects you can access.</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"><ChevronLeft size={18}/></button><p aria-live="polite" className="min-w-36 text-center font-semibold text-white">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p><button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"><ChevronRight size={18}/></button></div></header>
    {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"><div className="grid grid-cols-7 border-b border-slate-800">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="p-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:p-3 sm:text-xs">{day}</div>)}</div>
      {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400"><Loader2 className="animate-spin" size={18}/>Loading tasks…</div> : <div className="grid grid-cols-7">{cells.map((day, index) => { const date = day ? new Date(month.getFullYear(), month.getMonth(), day) : null; const events = date ? byDate[keyFor(date)] || [] : []; const selected = date && selectedDay && keyFor(date) === keyFor(selectedDay); return <button key={index} type="button" disabled={!day} onClick={() => setSelectedDay(date)} aria-label={day ? `${date.toLocaleDateString()}, ${events.length} due tasks` : undefined} aria-pressed={Boolean(selected)} className={`min-h-20 border-b border-r border-slate-800 p-1.5 text-left sm:min-h-28 sm:p-2 ${day ? 'hover:bg-slate-800/60' : 'bg-slate-950/30'} ${selected ? 'ring-2 ring-inset ring-indigo-500' : ''}`}>
        {day && <><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${selected ? 'bg-indigo-600 font-bold text-white' : 'text-slate-300'}`}>{day}</span><div className="mt-1 space-y-1">{events.slice(0, 2).map((task) => <span key={task._id} className="block truncate rounded bg-indigo-950/70 px-1 py-0.5 text-[9px] text-indigo-200 sm:text-[10px]">{task.title}</span>)}{events.length > 2 && <span className="block px-1 text-[9px] text-slate-500">+{events.length - 2} more</span>}</div></>}
      </button>; })}</div>}</div>
    {!loading && !error && tasks.length === 0 && <p className="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">No tasks have due dates in this month. Tasks without a due date do not appear on the calendar.</p>}
    {selectedDay && <section aria-live="polite" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"><h2 className="font-semibold text-white">{selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>{selectedTasks.length ? <ul className="mt-3 divide-y divide-slate-800">{selectedTasks.map((task) => <li key={task._id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="text-sm font-medium text-slate-200">{task.title}</p><p className="text-xs text-slate-500">{task.project?.title} · {task.status} · {task.priority}{task.assignedTo ? ` · ${task.assignedTo.name}` : ''}</p></div><Link to={`/projects/${task.project?._id}/board`} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-slate-700">Open project</Link></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No tasks due this day.</p>}</section>}
  </main>;
}
