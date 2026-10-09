import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deleteProjectFile, downloadProjectFile, getProjectFiles, uploadProjectFile } from '../services/collaborationService';

const ACCEPTED = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp';
const MAX_BYTES = Number(import.meta.env.VITE_MAX_UPLOAD_BYTES) || 10 * 1024 * 1024;

export function ProjectFiles({ projectId, isOwner }) {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const refresh = async () => {
    try { const data = await getProjectFiles(projectId); setFiles(data.files || []); setError(''); }
    catch (err) { setError(err.response?.data?.message || 'Could not load shared files.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { setFiles([]); setLoading(true); refresh(); }, [projectId]);

  const upload = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) { setError(`Files must be ${(MAX_BYTES / 1048576).toFixed(1)} MB or smaller.`); return; }
    setBusy(true); setProgress(0); setError('');
    try { await uploadProjectFile(projectId, file, (e) => { if (e.total) setProgress(Math.round(e.loaded * 100 / e.total)); }); await refresh(); }
    catch (err) { setError(err.response?.data?.message || 'Upload failed.'); }
    finally { setBusy(false); setProgress(0); }
  };

  const download = async (file) => {
    setError('');
    try { const blob = await downloadProjectFile(projectId, file._id); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.originalFilename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    catch (err) { setError(err.response?.data?.message || 'Download failed.'); }
  };
  const remove = async (file) => {
    if (!window.confirm(`Delete “${file.originalFilename}”?`)) return;
    try { await deleteProjectFile(projectId, file._id); setFiles((items) => items.filter((item) => item._id !== file._id)); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete file.'); }
  };
  const formatSize = (size) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1048576).toFixed(1)} MB`;

  return <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4" aria-labelledby="shared-files-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="shared-files-title" className="text-lg font-bold text-white">Shared files</h2><p className="mt-1 text-xs text-slate-400">Private project documents and images</p></div>
      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 ${busy ? 'opacity-60' : ''}`}><Upload size={15}/>{busy ? `Uploading ${progress}%` : 'Upload file'}<input type="file" accept={ACCEPTED} disabled={busy} onChange={upload} className="sr-only" aria-label="Upload a project file"/></label>
    </div>
    {busy && <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }}/></div>}
    {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-2 text-xs text-rose-200">{error}</p>}
    {loading ? <div className="flex items-center gap-2 py-5 text-xs text-slate-400"><Loader2 size={16} className="animate-spin"/>Loading files…</div> : files.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 py-6 text-center text-xs text-slate-500">No files shared yet.</p> :
      <ul className="divide-y divide-slate-800">{files.map((file) => { const canDelete = isOwner || (file.uploader?._id || file.uploader)?.toString() === currentUser?._id?.toString(); return <li key={file._id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-indigo-400"/><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{file.originalFilename}</p><p className="text-[11px] text-slate-500">{formatSize(file.fileSize)} · {file.uploader?.name || 'Member'} · {new Date(file.createdAt).toLocaleDateString()}</p></div></div><div className="flex gap-1"><button type="button" onClick={() => download(file)} aria-label={`Download ${file.originalFilename}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><Download size={16}/></button>{canDelete && <button type="button" onClick={() => remove(file)} aria-label={`Delete ${file.originalFilename}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-300"><Trash2 size={16}/></button>}</div></li>; })}</ul>}
  </section>;
}
