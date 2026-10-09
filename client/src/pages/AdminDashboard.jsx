import React, { useEffect, useState } from 'react';
import { Loader2, Search, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (currentUser?.role !== 'admin') return; api.get('/admin/overview').then(({ data }) => setOverview(data.stats)).catch((err) => setError(err.response?.data?.message || 'Could not load administration data.')); }, [currentUser]);
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    let active = true; setLoading(true); setError('');
    const request = tab === 'users' ? api.get('/admin/users', { params: { page, search: appliedSearch } }) : api.get('/admin/posts', { params: { page } });
    request.then(({ data }) => { if (!active) return; if (tab === 'users') setUsers(data.users); else setPosts(data.posts); setTotalPages(data.totalPages || 1); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load records.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, page, appliedSearch, currentUser]);

  if (currentUser?.role !== 'admin') return <main className="mx-auto max-w-3xl px-4 py-16 text-center"><ShieldAlert className="mx-auto h-10 w-10 text-rose-400"/><h1 className="mt-3 text-2xl font-bold text-white">Administrator access required</h1><p className="mt-2 text-sm text-slate-400">This page is available only to server-authorized administrators.</p></main>;

  const setStatus = async (user) => {
    const next = !user.isActive;
    if (!window.confirm(`${next ? 'Reactivate' : 'Suspend'} ${user.name}?${next ? '' : ' They will be signed out.'}`)) return;
    try { const { data } = await api.patch(`/admin/users/${user._id}/status`, { isActive: next }); setUsers((items) => items.map((item) => item._id === user._id ? data.user : item)); }
    catch (err) { setError(err.response?.data?.message || 'Could not update account status.'); }
  };
  const moderate = async (post) => {
    const next = !post.moderated;
    if (!window.confirm(`${next ? 'Hide' : 'Restore'} this post?`)) return;
    try { await api.patch(`/admin/posts/${post._id}/moderation`, { moderated: next }); setPosts((items) => items.map((item) => item._id === post._id ? { ...item, moderated: next } : item)); }
    catch (err) { setError(err.response?.data?.message || 'Could not moderate post.'); }
  };

  const stats = overview ? [['Users', overview.users], ['Active accounts', overview.activeUsers], ['Projects', overview.projects], ['Tasks', overview.tasks], ['Posts', overview.posts]] : [];
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-labelledby="admin-title">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Restricted tools</p><h1 id="admin-title" className="mt-1 flex items-center gap-2 text-3xl font-extrabold text-white"><Users className="h-7 w-7 text-rose-400"/>Admin dashboard</h1><p className="mt-2 text-sm text-slate-400">Every action is authorized on the server and recorded.</p></header>
    {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">{stats.map(([label, value]) => <article key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-extrabold text-white">{value ?? <Loader2 size={18} className="animate-spin"/>}</p></article>)}</section>
    {overview && <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"><h2 className="text-sm font-semibold text-white">Activity in the last 30 days</h2><p className="mt-2 text-xs text-slate-400">{overview.recent.users} new users · {overview.recent.projects} projects · {overview.recent.tasks} tasks · {overview.recent.posts} posts</p></section>}
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4"><div className="flex gap-2"><button onClick={() => { setTab('users'); setPage(1); }} aria-pressed={tab === 'users'} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Users</button><button onClick={() => { setTab('posts'); setPage(1); }} aria-pressed={tab === 'posts'} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'posts' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Social posts</button></div>{tab === 'users' && <form onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()); }} className="flex gap-2"><label htmlFor="admin-search" className="sr-only">Search users</label><input id="admin-search" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} placeholder="Search name or email" className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"/><button aria-label="Search users" className="rounded-lg bg-slate-800 p-2 text-slate-200"><Search size={15}/></button></form>}</div>
      {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-300"/></div> : tab === 'users' ? <div className="divide-y divide-slate-800">{users.map((user) => <article key={user._id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-sm font-semibold text-white">{user.name} <span className="ml-1 text-[10px] uppercase text-indigo-300">{user.role}</span></p><p className="text-xs text-slate-400">{user.email} · Joined {new Date(user.createdAt).toLocaleDateString()}</p><p className={`mt-1 text-[10px] font-semibold ${user.isActive ? 'text-emerald-300' : 'text-rose-300'}`}>{user.isActive ? 'Active' : 'Suspended'}</p></div><button onClick={() => setStatus(user)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${user.isActive ? 'border-rose-800 text-rose-300' : 'border-emerald-800 text-emerald-300'}`}>{user.isActive ? 'Suspend' : 'Reactivate'}</button></article>)}</div> : <div className="divide-y divide-slate-800">{posts.map((post) => <article key={post._id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm text-slate-200">{post.content}</p><p className="mt-1 text-xs text-slate-500">{post.author?.name} · {new Date(post.createdAt).toLocaleDateString()} · {post.comments.length} comments</p><p className={`mt-1 text-[10px] ${post.moderated ? 'text-rose-300' : 'text-emerald-300'}`}>{post.moderated ? 'Hidden' : 'Visible'}</p></div><button onClick={() => moderate(post)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200">{post.moderated ? 'Restore' : 'Hide post'}</button></article>)}</div>}
      {!loading && totalPages > 1 && <div className="flex items-center justify-center gap-3 border-t border-slate-800 p-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-40">Next</button></div>}
    </section>
    {overview?.recentAdminActions?.length > 0 && <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"><h2 className="text-sm font-semibold text-white">Recent administrator actions</h2><ul className="mt-3 space-y-2">{overview.recentAdminActions.map((action) => <li key={action._id} className="text-xs text-slate-400">{action.admin?.name || 'Admin'} {action.action} · {action.targetType} · {new Date(action.createdAt).toLocaleString()}</li>)}</ul></section>}
  </main>;
}
