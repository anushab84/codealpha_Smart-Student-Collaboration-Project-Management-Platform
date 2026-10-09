import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Circle, Eraser, Loader2, Pencil, RectangleHorizontal, Type, Undo2 } from 'lucide-react';
import { connectProjectSocket, socket } from '../services/socket';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;

function drawBoard(canvas, items) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for (const item of items) {
    ctx.strokeStyle = item.color; ctx.fillStyle = item.color; ctx.lineWidth = item.width || 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (item.type === 'stroke' && item.points?.length) {
      ctx.beginPath(); ctx.moveTo(item.points[0].x * CANVAS_WIDTH, item.points[0].y * CANVAS_HEIGHT);
      item.points.slice(1).forEach((point) => ctx.lineTo(point.x * CANVAS_WIDTH, point.y * CANVAS_HEIGHT)); ctx.stroke();
    } else if (item.type === 'rect') ctx.strokeRect(item.x * CANVAS_WIDTH, item.y * CANVAS_HEIGHT, item.w * CANVAS_WIDTH, item.h * CANVAS_HEIGHT);
    else if (item.type === 'ellipse') { ctx.beginPath(); ctx.ellipse((item.x + item.w / 2) * CANVAS_WIDTH, (item.y + item.h / 2) * CANVAS_HEIGHT, item.w * CANVAS_WIDTH / 2, item.h * CANVAS_HEIGHT / 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (item.type === 'text') { ctx.font = `${Math.max(16, (item.width || 3) * 6)}px sans-serif`; ctx.textBaseline = 'top'; ctx.fillText(item.text, item.x * CANVAS_WIDTH, item.y * CANVAS_HEIGHT, CANVAS_WIDTH * (1 - item.x)); }
  }
}

export default function Whiteboard() {
  const { id: projectId } = useParams();
  const canvasRef = useRef(null);
  const itemsRef = useRef([]);
  const history = useRef([]);
  const drawing = useRef(null);
  const [items, setItems] = useState([]);
  const [tool, setTool] = useState('stroke');
  const [color, setColor] = useState('#4f46e5');
  const [width, setWidth] = useState(3);
  const [connected, setConnected] = useState(socket.connected);
  const [joined, setJoined] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Connecting…');
  const [error, setError] = useState('');

  const applyItems = (next) => { itemsRef.current = next; setItems(next); };
  const save = (next) => {
    applyItems(next);
    if (!socket.connected || !joined) { setSaveStatus('Offline; changes will sync after reconnect'); return; }
    setSaveStatus('Saving…');
    socket.emit('board:update', { projectId, items: next }, (result) => {
      if (result?.success) setSaveStatus(`Saved ${new Date(result.updatedAt).toLocaleTimeString()}`);
      else { setError(result?.message || 'Could not save board changes.'); setSaveStatus('Save failed'); }
    });
  };

  useEffect(() => {
    applyItems([]); setJoined(false); setError(''); setSaveStatus('Connecting…');
    const onConnect = () => {
      setConnected(true); setSaveStatus('Loading saved board…');
      socket.emit('board:join', { projectId }, (result) => {
        if (result?.success) { applyItems(result.items || []); setJoined(true); setError(''); setSaveStatus('Connected'); }
        else { setJoined(false); setError(result?.message || 'Could not join board.'); setSaveStatus('Access denied'); }
      });
    };
    const onDisconnect = () => { setConnected(false); setJoined(false); setSaveStatus('Reconnecting…'); };
    const onConnectError = (err) => { setConnected(false); setJoined(false); setError(err.message || 'Connection failed.'); setSaveStatus('Offline'); };
    const onUpdate = (payload) => { if (payload.projectId === projectId) { applyItems(payload.items || []); setSaveStatus('Synced with project'); } };
    socket.on('connect', onConnect); socket.on('disconnect', onDisconnect); socket.on('connect_error', onConnectError); socket.on('project:board-updated', onUpdate);
    connectProjectSocket(); if (socket.connected) onConnect();
    return () => { socket.emit('board:leave', { projectId }); socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('connect_error', onConnectError); socket.off('project:board-updated', onUpdate); };
  }, [projectId]);

  useEffect(() => { if (canvasRef.current) drawBoard(canvasRef.current, items); }, [items]);

  const pointFrom = (event) => { const rect = canvasRef.current.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) }; };
  const pointerDown = (event) => {
    if (!joined) return;
    if (itemsRef.current.length >= 1000) { setError('This board reached the 1000 element limit. Undo or clear items before adding more.'); return; }
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFrom(event); history.current.push(itemsRef.current);
    if (tool === 'text') {
      const text = window.prompt('Text to add to the board');
      if (text?.trim()) save([...itemsRef.current, { type: 'text', ...point, text: text.trim().slice(0, 500), color, width }]);
      else history.current.pop();
      return;
    }
    drawing.current = { type: tool, start: point, item: tool === 'stroke' ? { type: 'stroke', points: [point], color, width } : { type: tool, ...point, w: 0, h: 0, color, width } };
    applyItems([...itemsRef.current, drawing.current.item]);
  };
  const pointerMove = (event) => {
    if (!drawing.current) return;
    const point = pointFrom(event); const active = drawing.current;
    if (active.type === 'stroke' && active.item.points.length < 1000) active.item.points.push(point);
    else { active.item.x = Math.min(active.start.x, point.x); active.item.y = Math.min(active.start.y, point.y); active.item.w = Math.abs(point.x - active.start.x); active.item.h = Math.abs(point.y - active.start.y); }
    applyItems([...itemsRef.current.slice(0, -1), active.item]);
  };
  const pointerUp = () => { if (!drawing.current) return; const next = [...itemsRef.current]; drawing.current = null; save(next); };
  const undo = () => { if (history.current.length) save(history.current.pop()); };
  const clear = () => { if (!itemsRef.current.length || !window.confirm('Clear the shared whiteboard for everyone?')) return; history.current.push(itemsRef.current); save([]); };

  const tools = [['stroke', Pencil, 'Freehand'], ['rect', RectangleHorizontal, 'Rectangle'], ['ellipse', Circle, 'Ellipse'], ['text', Type, 'Text']];
  return <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6" aria-labelledby="whiteboard-title">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><Link to={`/projects/${projectId}`} className="mb-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14}/>Back to project</Link><h1 id="whiteboard-title" className="text-3xl font-extrabold text-white">Collaborative whiteboard</h1><p className="mt-1 text-xs text-slate-400">Simple drawing and shapes synchronize and save for project members.</p></div><span className={`rounded-full px-3 py-1 text-xs ${connected && joined ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>{connected && joined ? 'Connected' : 'Reconnecting…'}</span></header>
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4"><div className="flex flex-wrap items-center gap-2">{tools.map(([name, Icon, label]) => <button type="button" key={name} onClick={() => setTool(name)} aria-pressed={tool === name} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${tool === name ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><Icon size={15}/>{label}</button>)}<label className="ml-auto flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">Color<input type="color" aria-label="Drawing color" value={color} onChange={(e) => setColor(e.target.value)} className="h-5 w-7 cursor-pointer border-0 bg-transparent"/></label><label className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">Width<input type="range" min="1" max="12" value={width} onChange={(e) => setWidth(Number(e.target.value))} aria-label="Drawing width"/></label><button type="button" onClick={undo} disabled={!items.length || !joined} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"><Undo2 size={15}/>Undo</button><button type="button" onClick={clear} disabled={!items.length || !joined} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs text-rose-300 disabled:opacity-40"><Eraser size={15}/>Clear</button></div>
      {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-2 text-xs text-rose-200">{error}</p>}
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label="Shared drawing canvas" className={`block h-[55vh] min-h-72 w-full touch-none rounded-xl bg-white ${joined ? 'cursor-crosshair' : 'cursor-wait'}`}/>
      <div className="flex items-center justify-between text-[11px] text-slate-500"><span>{items.length} board elements</span><span aria-live="polite">{saveStatus}</span></div>
    </section>
  </main>;
}
