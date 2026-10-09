import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { connectProjectSocket, socket } from '../services/socket';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { setCount(0); setItems([]); socket.disconnect(); return undefined; }
    let active = true;
    const onNotification = ({ notification }) => {
      if (!notification) return;
      setItems((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 30));
      if (!notification.read) setCount((current) => current + 1);
    };
    socket.on('notification:new', onNotification);
    connectProjectSocket();
    api.get('/notifications/unread-count').then(({ data }) => { if (active) setCount(data.count || 0); }).catch(() => {});
    return () => { active = false; socket.off('notification:new', onNotification); socket.disconnect(); };
  }, [isAuthenticated]);

  const toggle = async () => {
    const next = !open; setOpen(next);
    if (!next) return;
    setLoading(true); setError('');
    try { const { data } = await api.get('/notifications', { params: { limit: 30 } }); setItems(data.notifications || []); }
    catch (err) { setError(err.response?.data?.message || 'Could not load notifications.'); }
    finally { setLoading(false); }
  };

  const markRead = async (item) => {
    if (!item.read) {
      try { const { data } = await api.patch(`/notifications/${item._id}/read`); setItems((current) => current.map((entry) => entry._id === item._id ? data.notification : entry)); setCount((current) => Math.max(0, current - 1)); }
      catch (err) { setError(err.response?.data?.message || 'Could not update notification.'); return; }
    }
    setOpen(false);
    if (item.project?._id || item.project) navigate(`/projects/${item.project?._id || item.project}`);
  };

  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); setItems((current) => current.map((item) => ({ ...item, read: true }))); setCount(0); }
    catch (err) { setError(err.response?.data?.message || 'Could not update notifications.'); }
  };

  if (!isAuthenticated) return null;
  return <div className="relative">
    <button type="button" onClick={toggle} aria-label={`Notifications${count ? `, ${count} unread` : ''}`} aria-expanded={open} className="relative rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white"><Bell className="h-5 w-5"/>{count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>}</button>
    {open && <div className="absolute right-0 z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div><p className="text-sm font-semibold text-white">Notifications</p><p className="text-[11px] text-slate-400">{count} unread</p></div><button type="button" onClick={markAllRead} disabled={count === 0} className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white disabled:opacity-40"><CheckCheck size={14}/>Mark all read</button></div>
      {error && <p role="alert" className="px-4 pt-2 text-xs text-rose-300">{error}</p>}
      <div className="max-h-80 overflow-y-auto">{loading ? <p className="flex items-center justify-center gap-2 p-6 text-xs text-slate-400"><Loader2 size={15} className="animate-spin"/>Loading…</p> : items.length ? items.map((item) => <button key={item._id} type="button" onClick={() => markRead(item)} className={`block w-full border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800/70 ${item.read ? 'bg-slate-900' : 'bg-indigo-950/30'}`}><span className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-slate-700' : 'bg-indigo-400'}`}/><span><span className="block text-sm text-slate-200">{item.message}</span><span className="mt-1 block text-[11px] text-slate-500">{item.actor?.name ? `${item.actor.name} · ` : ''}{new Date(item.createdAt).toLocaleString()}{item.project?.title ? ` · ${item.project.title}` : ''}</span></span></span></button>) : <p className="p-6 text-center text-xs text-slate-500">You’re all caught up.</p>}</div>
    </div>}
  </div>;
}
