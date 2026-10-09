import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Phone, PhoneOff, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function loadJitsiApi(domain) {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  const source = `https://${domain}/external_api.js`;
  if (window.__collabhubJitsiPromise) return window.__collabhubJitsiPromise;
  window.__collabhubJitsiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = source; script.async = true;
    script.onload = () => window.JitsiMeetExternalAPI ? resolve() : reject(new Error('Meeting provider script did not initialize'));
    script.onerror = () => reject(new Error('Could not load the meeting provider. Check the Jitsi domain and network connection.'));
    document.head.appendChild(script);
  });
  return window.__collabhubJitsiPromise;
}

export function ProjectMeeting({ projectId, isOwner }) {
  const { currentUser } = useAuth();
  const container = useRef(null);
  const apiRef = useRef(null);
  const [meeting, setMeeting] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inMeeting, setInMeeting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setMeeting(null); setEnabled(false); setLoading(true); setError(''); setStatus(''); setInMeeting(false);
    apiRef.current?.dispose(); apiRef.current = null;
    api.get(`/projects/${projectId}/meeting`).then(({ data }) => { if (active) { setEnabled(data.enabled); setMeeting(data.meeting); setDomain(data.domain || ''); } })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load meeting information.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; apiRef.current?.dispose(); apiRef.current = null; };
  }, [projectId]);

  const dispose = () => { apiRef.current?.dispose(); apiRef.current = null; setInMeeting(false); };

  const startMeeting = async () => {
    setLoading(true); setError('');
    try { const { data } = await api.post(`/projects/${projectId}/meeting`); setMeeting(data.meeting); setDomain(data.domain); }
    catch (err) { setError(err.response?.data?.message || 'Could not start meeting.'); }
    finally { setLoading(false); }
  };

  const joinMeeting = async () => {
    if (!meeting) return;
    setJoining(true); setError(''); setStatus('Requesting a short-lived meeting credential…');
    try {
      setInMeeting(true);
      const { data } = await api.post(`/projects/${projectId}/meeting/${meeting._id}/token`);
      await loadJitsiApi(data.domain);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (!container.current) throw new Error('Meeting container is unavailable.');
      const frame = new window.JitsiMeetExternalAPI(data.domain, {
        roomName: data.roomName,
        jwt: data.token,
        parentNode: container.current,
        width: '100%', height: 480,
        configOverwrite: { prejoinPageEnabled: true, startWithAudioMuted: false, startWithVideoMuted: false },
        interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false }
      });
      apiRef.current = frame;
      frame.addListener('videoConferenceJoined', () => setStatus('Connected. Use the meeting controls to manage your camera and microphone.'));
      frame.addListener('videoConferenceLeft', () => { dispose(); setStatus('You left the meeting.'); });
      frame.addListener('cameraError', () => setError('Camera access failed. Check browser permissions and your camera device.'));
      frame.addListener('micError', () => setError('Microphone access failed. Check browser permissions and your microphone device.'));
      frame.addListener('readyToClose', () => { dispose(); setStatus('Meeting closed.'); });
      setStatus('Waiting for the meeting connection…');
    } catch (err) { setInMeeting(false); setError(err.response?.data?.message || err.message || 'Could not join meeting.'); setStatus(''); }
    finally { setJoining(false); }
  };

  const leave = () => { dispose(); setStatus('You left the meeting.'); };
  const endMeeting = async () => {
    if (!meeting || !window.confirm('End the project meeting for everyone?')) return;
    setError('');
    try { await api.delete(`/projects/${projectId}/meeting/${meeting._id}`); dispose(); setMeeting(null); setStatus('Meeting ended.'); }
    catch (err) { setError(err.response?.data?.message || 'Could not end meeting.'); }
  };
  const canEnd = meeting && (isOwner || (meeting.createdBy?._id || meeting.createdBy)?.toString() === currentUser?._id?.toString());

  return <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5" aria-labelledby="meeting-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="meeting-title" className="flex items-center gap-2 text-lg font-bold text-white"><Video size={19} className="text-indigo-400"/>Project meeting</h2><p className="mt-1 text-xs text-slate-400">Meetings are restricted to members in CollabHub; provider JWTs are short-lived.</p></div>
      {loading ? <Loader2 className="animate-spin text-indigo-300" size={18}/> : !enabled ? <span className="text-xs text-amber-300">Provider setup required</span> : !meeting ? <button type="button" onClick={startMeeting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Video size={15}/>Start meeting</button> : <div className="flex flex-wrap gap-2">{!inMeeting && <button type="button" disabled={joining} onClick={joinMeeting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{joining ? <Loader2 size={15} className="animate-spin"/> : <Phone size={15}/>}Join meeting</button>}{inMeeting && <button type="button" onClick={leave} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200"><PhoneOff size={15}/>Leave</button>}{canEnd && <button type="button" onClick={endMeeting} className="rounded-lg border border-rose-800 px-3 py-2 text-xs font-semibold text-rose-300">End for everyone</button>}</div>}
    </div>
    {!enabled && <p className="mt-3 rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-200">Configure JITSI_DOMAIN, JITSI_APP_ID, and JITSI_APP_SECRET in the backend and enable JWT authentication on your Jitsi provider. The secret never goes to the browser. HTTPS and working camera/microphone permissions are required.</p>}
    {meeting && <p className="mt-3 text-xs text-slate-400">Started {new Date(meeting.startedAt).toLocaleString()} by {meeting.createdBy?.name || 'a project member'}{domain ? ` · ${domain}` : ''}</p>}
    {status && <p role="status" className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300"><Camera size={14} className="text-indigo-300"/>{status}</p>}
    {error && <p role="alert" className="mt-3 rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-xs text-rose-200">{error}</p>}
    {meeting && <div ref={container} className={`${inMeeting ? 'mt-4 min-h-40 overflow-hidden rounded-xl bg-slate-950' : 'hidden'}`} aria-label="Video meeting"/>}
  </section>;
}
