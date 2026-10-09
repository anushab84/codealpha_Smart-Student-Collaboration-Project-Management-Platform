import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = ['all', 'projects', 'tasks', 'users', 'posts'];

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try { const { data } = await api.get('/search', { params: { q: query, ...(category !== 'all' ? { type: category } : {}) } }); setResults(data.results); }
    catch (err) { setResults(null); setError(err.response?.data?.message || 'Search failed.'); }
    finally { setLoading(false); }
  };

  const entries = results ? Object.entries(results).filter(([type]) => category === 'all' || type === category) : [];
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6" aria-labelledby="search-title">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Find your work</p><h1 id="search-title" className="mt-1 text-3xl font-extrabold text-white">Global search</h1><p className="mt-2 text-sm text-slate-400">Search projects and tasks you can access, public profiles, and community posts.</p></header>
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><label htmlFor="global-query" className="sr-only">Search query</label><div className="flex flex-col gap-2 sm:flex-row"><input id="global-query" value={query} onChange={(e) => setQuery(e.target.value)} minLength={2} maxLength={100} required placeholder="Search projects, tasks, people, posts…" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"/><select aria-label="Search category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">{CATEGORIES.map((item) => <option key={item} value={item}>{item === 'all' ? 'All categories' : item[0].toUpperCase() + item.slice(1)}</option>)}</select><button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin"/> : <SearchIcon size={16}/>}Search</button></div></form>
    {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
    {results && !loading && <div className="space-y-5">{entries.map(([type, items]) => <section key={type} className="space-y-2"><h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">{type} <span className="text-slate-500">({items.length})</span></h2>{items.length ? <div className="space-y-2">{items.map((item) => <article key={item._id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">{type === 'projects' ? <Link to={`/projects/${item._id}`} className="font-semibold text-indigo-300 hover:text-white">{item.title}</Link> : type === 'tasks' ? <Link to={`/projects/${item.project?._id}/board`} className="font-semibold text-indigo-300 hover:text-white">{item.title}</Link> : type === 'users' ? <div className="flex items-center gap-3">{item.profileImage && <img src={item.profileImage} alt="" className="h-9 w-9 rounded-full object-cover"/>}<div><p className="font-semibold text-white">{item.name}</p>{item.bio && <p className="text-xs text-slate-400">{item.bio}</p>}</div></div> : <Link to="/feed" className="block whitespace-pre-wrap text-sm text-slate-200 hover:text-white">{item.content}</Link>}
          {type === 'projects' && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.description}</p>}{type === 'tasks' && <p className="mt-1 text-xs text-slate-400">{item.project?.title} · {item.status} · {item.priority}{item.dueDate ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}` : ''}</p>}{type === 'posts' && <p className="mt-1 text-xs text-slate-500">By {item.author?.name || 'Member'}</p>}</article>)}</div> : <p className="rounded-xl border border-dashed border-slate-800 p-4 text-xs text-slate-500">No matching {type} found.</p>}</section>)}</div>}
  </main>;
}
