import React, { useCallback, useEffect, useState } from 'react';
import { Heart, Loader2, MessageCircle, Pencil, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Feed() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [comments, setComments] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async (requestedPage = 1) => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/posts', { params: { page: requestedPage, limit: 10 } }); setPosts(data.posts || []); setPage(data.page); setTotalPages(data.totalPages || 1); }
    catch (err) { setError(err.response?.data?.message || 'Could not load the feed.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (event) => {
    event.preventDefault(); if (!content.trim()) return;
    setSaving(true); setError('');
    try { const { data } = await api.post('/posts', { content, imageUrl }); setPosts((items) => [data.post, ...items]); setContent(''); setImageUrl(''); }
    catch (err) { setError(err.response?.data?.message || 'Could not publish your post.'); }
    finally { setSaving(false); }
  };

  const saveEdit = async (postId) => {
    try { const { data } = await api.put(`/posts/${postId}`, { content: editing.content, imageUrl: editing.imageUrl }); setPosts((items) => items.map((post) => post._id === postId ? { ...post, ...data.post } : post)); setEditing(null); }
    catch (err) { setError(err.response?.data?.message || 'Could not update post.'); }
  };
  const removePost = async (post) => {
    if (!window.confirm('Delete this post and its comments?')) return;
    try { await api.delete(`/posts/${post._id}`); setPosts((items) => items.filter((item) => item._id !== post._id)); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete post.'); }
  };
  const toggleLike = async (post) => {
    try { const { data } = await api.post(`/posts/${post._id}/likes`); setPosts((items) => items.map((item) => item._id === post._id ? { ...item, likes: data.likes } : item)); }
    catch (err) { setError(err.response?.data?.message || 'Could not update like.'); }
  };
  const addComment = async (event, postId) => {
    event.preventDefault(); const contentValue = comments[postId]?.trim(); if (!contentValue) return;
    try { const { data } = await api.post(`/posts/${postId}/comments`, { content: contentValue }); setPosts((items) => items.map((post) => post._id === postId ? { ...post, comments: [...post.comments, data.comment] } : post)); setComments((values) => ({ ...values, [postId]: '' })); }
    catch (err) { setError(err.response?.data?.message || 'Could not add comment.'); }
  };
  const updateComment = async (post, comment) => {
    const value = window.prompt('Edit your comment', comment.content);
    if (value === null || !value.trim()) return;
    try { const { data } = await api.put(`/posts/${post._id}/comments/${comment._id}`, { content: value }); setPosts((items) => items.map((item) => item._id === post._id ? { ...item, comments: item.comments.map((entry) => entry._id === comment._id ? data.comment : entry) } : item)); }
    catch (err) { setError(err.response?.data?.message || 'Could not edit comment.'); }
  };
  const deleteComment = async (post, comment) => {
    if (!window.confirm('Delete your comment?')) return;
    try { await api.delete(`/posts/${post._id}/comments/${comment._id}`); setPosts((items) => items.map((item) => item._id === post._id ? { ...item, comments: item.comments.filter((entry) => entry._id !== comment._id) } : item)); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete comment.'); }
  };
  const owns = (id) => (id?._id || id)?.toString() === currentUser?._id?.toString();

  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6" aria-labelledby="feed-title">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">CollabHub community</p><h1 id="feed-title" className="mt-1 text-3xl font-extrabold text-white">Collaboration feed</h1><p className="mt-2 text-sm text-slate-400">Share project updates and ideas with the community.</p></header>
    {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
    <form onSubmit={create} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><label htmlFor="post-content" className="text-sm font-semibold text-slate-200">Create a post</label><textarea id="post-content" value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} rows={3} placeholder="What are you working on?" className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"/><label htmlFor="post-image" className="block text-xs text-slate-400">Optional image URL</label><input id="post-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"/><div className="flex items-center justify-between text-xs text-slate-500"><span>{content.length}/5000</span><button disabled={saving || !content.trim()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}Publish</button></div></form>
    {loading ? <div className="flex justify-center py-16 text-indigo-300"><Loader2 className="animate-spin"/></div> : posts.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">No posts yet. Share the first project update.</div> : <div className="space-y-4">{posts.map((post) => {
      const liked = post.likes.some((id) => owns(id)); const ownPost = owns(post.author);
      return <article key={post._id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5"><header className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-700 font-bold text-white">{post.author?.name?.[0]?.toUpperCase() || '?'}</div><div><p className="text-sm font-semibold text-white">{post.author?.name || 'Member'}</p><time className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</time></div></div>{ownPost && <div className="flex gap-1"><button onClick={() => setEditing({ id: post._id, content: post.content, imageUrl: post.imageUrl || '' })} aria-label="Edit post" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-indigo-300"><Pencil size={16}/></button><button onClick={() => removePost(post)} aria-label="Delete post" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-300"><Trash2 size={16}/></button></div>}</header>
        {editing?.id === post._id ? <div className="space-y-2"><textarea value={editing.content} maxLength={5000} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white"/><input type="url" value={editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} placeholder="Image URL" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white"/><div className="flex justify-end gap-2"><button onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-slate-300"><X size={14}/>Cancel</button><button onClick={() => saveEdit(post._id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Save</button></div></div> : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{post.content}</p>}
        {post.imageUrl && <img src={post.imageUrl} loading="lazy" alt="Post attachment" referrerPolicy="no-referrer" className="max-h-96 w-full rounded-xl border border-slate-800 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }}/>}<div className="flex items-center gap-4 border-b border-slate-800 pb-3"><button onClick={() => toggleLike(post)} aria-pressed={liked} className={`inline-flex items-center gap-1.5 text-xs ${liked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-300'}`}><Heart size={16} fill={liked ? 'currentColor' : 'none'}/>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</button><span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><MessageCircle size={15}/>{post.comments.length} comments</span></div>
        <div className="space-y-3">{post.comments.map((comment) => <div key={comment._id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-950/60 p-3"><div><p className="text-xs font-semibold text-slate-300">{comment.author?.name || 'Member'} <time className="ml-1 font-normal text-slate-600">{new Date(comment.createdAt).toLocaleDateString()}</time></p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{comment.content}</p></div>{owns(comment.author) && <div className="flex shrink-0"><button onClick={() => updateComment(post, comment)} aria-label="Edit comment" className="p-1 text-slate-500 hover:text-indigo-300"><Pencil size={13}/></button><button onClick={() => deleteComment(post, comment)} aria-label="Delete comment" className="p-1 text-slate-500 hover:text-rose-300"><Trash2 size={13}/></button></div>}</div>)}<form onSubmit={(e) => addComment(e, post._id)} className="flex gap-2"><label className="sr-only" htmlFor={`comment-${post._id}`}>Write a comment</label><input id={`comment-${post._id}`} value={comments[post._id] || ''} maxLength={2000} onChange={(e) => setComments((values) => ({ ...values, [post._id]: e.target.value }))} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"/><button disabled={!comments[post._id]?.trim()} aria-label="Post comment" className="rounded-lg bg-slate-800 px-3 text-indigo-300 disabled:opacity-40"><Send size={15}/></button></form></div>
      </article>;
    })}</div>}
    {!loading && totalPages > 1 && <div className="flex items-center justify-center gap-3"><button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-200 disabled:opacity-40">Previous</button><span className="text-xs text-slate-400">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => load(page + 1)} className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-200 disabled:opacity-40">Next</button></div>}
  </main>;
}
