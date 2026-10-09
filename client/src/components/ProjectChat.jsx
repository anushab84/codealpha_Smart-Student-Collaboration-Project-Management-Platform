import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { connectProjectSocket, socket } from '../services/socket';
import api from '../services/api';

const addUnique = (list, message) => list.some((item) => item._id === message._id) ? list : [...list, message];

export function ProjectChat({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [connected, setConnected] = useState(socket.connected);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const mounted = useRef(true);

  const loadInitial = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/projects/${projectId}/messages`, { params: { limit: 50 } });
      if (mounted.current) { setMessages(data.messages || []); setHasMore(Boolean(data.hasMore)); }
    } catch (err) { if (mounted.current) setError(err.response?.data?.message || 'Could not load chat history.'); }
    finally { if (mounted.current) setLoading(false); }
  }, [projectId]);

  useEffect(() => {
    mounted.current = true;
    setMessages([]); setText(''); setJoined(false); setLoading(true); setError('');
    const onConnect = () => {
      setConnected(true); setError('');
      socket.emit('project:join', { projectId }, (result) => {
        if (!mounted.current) return;
        setJoined(Boolean(result?.success));
        if (!result?.success) setError(result?.message || 'Could not join project chat.');
      });
    };
    const onDisconnect = () => { setConnected(false); setJoined(false); };
    const onConnectError = (err) => { setConnected(false); setJoined(false); setError(err.message || 'Chat connection failed.'); };
    const onMessage = ({ message }) => { if (message?.project === projectId || message?.project?._id === projectId) setMessages((items) => addUnique(items, message)); };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('project:message', onMessage);
    loadInitial();
    connectProjectSocket();
    if (socket.connected) onConnect();
    return () => {
      mounted.current = false;
      socket.emit('project:leave', { projectId });
      socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('connect_error', onConnectError); socket.off('project:message', onMessage);
    };
  }, [projectId, loadInitial]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages.length]);

  const loadOlder = async () => {
    if (!messages.length || loadingOlder) return;
    setLoadingOlder(true); setError('');
    try {
      const beforeId = messages[0]._id;
      const { data } = await api.get(`/projects/${projectId}/messages`, { params: { limit: 50, beforeId } });
      setMessages((items) => [...data.messages, ...items.filter((item) => !data.messages.some((older) => older._id === item._id))]);
      setHasMore(Boolean(data.hasMore));
    } catch (err) { setError(err.response?.data?.message || 'Could not load older messages.'); }
    finally { setLoadingOlder(false); }
  };

  const send = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || !joined || sending) return;
    setSending(true); setError('');
    socket.emit('project:send-message', { projectId, text: value }, (result) => {
      setSending(false);
      if (!result?.success) setError(result?.message || 'Message could not be sent.');
      else { setMessages((items) => addUnique(items, result.message)); setText(''); }
    });
  };

  return <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5" aria-label="Project chat">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="flex items-center gap-2 text-lg font-bold text-white"><MessageCircle className="h-5 w-5 text-indigo-400"/>Project chat</h2><p className="mt-1 text-xs text-slate-400">Messages are saved to this project.</p></div><span className={`inline-flex items-center gap-1.5 text-xs ${connected && joined ? 'text-emerald-300' : 'text-amber-300'}`}><span className={`h-2 w-2 rounded-full ${connected && joined ? 'bg-emerald-400' : 'bg-amber-400'}`}/>{!connected ? 'Reconnecting…' : joined ? 'Connected' : 'Joining…'}</span></div>
    {error && <p role="alert" className="mb-3 rounded-lg border border-rose-900 bg-rose-950/40 p-2 text-xs text-rose-200">{error}</p>}
    <div ref={scrollRef} className="h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3" aria-live="polite">
      {hasMore && <button disabled={loadingOlder} onClick={loadOlder} className="mb-3 w-full rounded-lg py-2 text-xs text-indigo-300 hover:bg-slate-900 disabled:opacity-50">{loadingOlder ? 'Loading…' : 'Load older messages'}</button>}
      {loading ? <p className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400"><Loader2 size={15} className="animate-spin"/>Loading conversation…</p> : messages.length ? <div className="space-y-3">{messages.map((message) => <article key={message._id} className="break-words"><p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-300">{message.sender?.name || 'Member'}</span> · {new Date(message.createdAt).toLocaleString()}</p><p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-200">{message.text}</p></article>)}</div> : <p className="py-10 text-center text-xs text-slate-500">No messages yet. Say hello to your project team.</p>}
    </div>
    <form onSubmit={send} className="mt-3 flex gap-2"><label className="sr-only" htmlFor="project-chat-message">Write a message</label><input id="project-chat-message" value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} placeholder={joined ? 'Write a message…' : 'Connecting to project chat…'} disabled={!joined || sending} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-60"/><button aria-label="Send message" disabled={!joined || sending || !text.trim()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-50"><Send size={15}/>Send</button></form>
  </section>;
}
