import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createTaskComment, deleteTaskComment, getTaskComments, updateTaskComment } from '../services/collaborationService';
import { Loader2, MessageSquare, Pencil, Send, Trash2, X } from 'lucide-react';

export function TaskDiscussion({ taskId }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setComments([]); setContent(''); setEditingId(null);
    setLoading(true); setError('');
    getTaskComments(taskId).then((data) => { if (active) setComments(data.comments || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load discussion.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true); setError('');
    try {
      if (editingId) {
        const data = await updateTaskComment(editingId, content);
        setComments((items) => items.map((item) => item._id === editingId ? data.comment : item));
      } else {
        const data = await createTaskComment(taskId, content);
        setComments((items) => [...items, data.comment]);
      }
      setContent(''); setEditingId(null);
    } catch (err) { setError(err.response?.data?.message || 'Could not save comment.'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try { await deleteTaskComment(id); setComments((items) => items.filter((item) => item._id !== id)); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete comment.'); }
  };

  return <section className="space-y-3 border-t border-slate-700 pt-4" aria-label="Task discussion">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><MessageSquare className="h-4 w-4 text-indigo-400" />Discussion <span className="text-xs text-slate-500">({comments.length})</span></h3>
    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
    {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading comments…</div> : comments.length === 0 ? <p className="text-xs text-slate-500">No comments yet. Start the conversation.</p> :
      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">{comments.map((comment) => {
        const own = (comment.author?._id || comment.author)?.toString() === currentUser?._id?.toString();
        return <article key={comment._id} className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold text-slate-200">{comment.author?.name || 'Member'} <time className="ml-1 font-normal text-slate-500">{new Date(comment.updatedAt || comment.createdAt).toLocaleString()}</time></p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">{comment.content}</p></div>
          {own && <div className="flex shrink-0 gap-1"><button type="button" aria-label="Edit comment" onClick={() => { setEditingId(comment._id); setContent(comment.content); }} className="rounded p-1 text-slate-400 hover:text-indigo-300"><Pencil size={14}/></button><button type="button" aria-label="Delete comment" onClick={() => remove(comment._id)} className="rounded p-1 text-slate-400 hover:text-rose-300"><Trash2 size={14}/></button></div>}</div>
        </article>;
      })}</div>}
    <form onSubmit={submit} className="space-y-2"><label className="sr-only" htmlFor="task-comment">Write a comment</label><textarea id="task-comment" value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} rows={2} placeholder="Write a comment…" className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none" />
      <div className="flex items-center justify-between"><span className="text-[11px] text-slate-500">{content.length}/5000</span><div className="flex gap-2">{editingId && <button type="button" onClick={() => { setEditingId(null); setContent(''); }} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-slate-300"><X size={14}/>Cancel</button>}<button disabled={saving || !content.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} {editingId ? 'Save' : 'Comment'}</button></div></div>
    </form>
  </section>;
}
