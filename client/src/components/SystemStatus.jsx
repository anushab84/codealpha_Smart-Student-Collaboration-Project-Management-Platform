import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import { socket } from '../services/socket';
import { RefreshCw, Server, Database, Radio, Monitor, AlertCircle } from 'lucide-react';

export const SystemStatus = () => {
  const [status, setStatus] = useState({
    loading: true,
    backendConnected: false,
    backendMessage: '',
    dbStatus: 'Checking...',
    socketConnected: false,
    error: null
  });

  const verifySystemHealth = async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const data = await checkHealth();
      if (data && data.success) {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          backendConnected: true,
          backendMessage: data.message || 'CollabHub backend is running',
          dbStatus: data.database || 'MongoDB',
          error: null
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          backendConnected: false,
          backendMessage: 'Backend connection unavailable',
          dbStatus: 'Disconnected',
          error: data?.error || 'Could not reach Express server'
        }));
      }
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        backendConnected: false,
        backendMessage: 'Backend connection unavailable',
        dbStatus: 'Disconnected',
        error: err.message
      }));
    }
  };

  useEffect(() => {
    verifySystemHealth();

    // Handle real-time socket status updates
    const onConnect = () => {
      setStatus((prev) => ({ ...prev, socketConnected: true }));
    };

    const onDisconnect = () => {
      setStatus((prev) => ({ ...prev, socketConnected: false }));
    };

    if (socket.connected) {
      setStatus((prev) => ({ ...prev, socketConnected: true }));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 my-8">
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-950/40 backdrop-blur-sm">
        
        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-700/60 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              System Status & Connectivity
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live connectivity for the frontend, REST API, database, and Socket.io
            </p>
          </div>

          <button
            type="button"
            onClick={verifySystemHealth}
            disabled={status.loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status.loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Error Notice Banner if Backend Unavailable */}
        {!status.loading && !status.backendConnected && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Backend connection unavailable.</p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Ensure the backend server is started with <code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-100 font-mono">npm run dev</code> inside the <code className="font-mono">server/</code> directory on port 5000.
              </p>
            </div>
          </div>
        )}

        {/* Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Frontend */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Frontend</p>
                <p className="text-sm font-semibold text-white">Vite / React</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {/* Backend API */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${status.backendConnected ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-400' : 'bg-rose-950/60 border-rose-800/60 text-rose-400'}`}>
                <Server className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Backend API</p>
                <p className="text-sm font-semibold text-white">Express Server</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
              status.backendConnected 
                ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-400' 
                : 'bg-rose-950/80 border-rose-700/80 text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status.backendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{status.backendConnected ? 'Connected' : 'Unavailable'}</span>
            </div>
          </div>

          {/* Database */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${status.dbStatus === 'MongoDB' || status.dbStatus === 'Connected' ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-400' : 'bg-amber-950/60 border-amber-800/60 text-amber-400'}`}>
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Database</p>
                <p className="text-sm font-semibold text-white">MongoDB Atlas</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
              status.dbStatus === 'MongoDB' || status.dbStatus === 'Connected'
                ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-400' 
                : 'bg-amber-950/80 border-amber-700/80 text-amber-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status.dbStatus === 'MongoDB' || status.dbStatus === 'Connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{status.dbStatus === 'MongoDB' ? 'Connected' : status.dbStatus}</span>
            </div>
          </div>

          {/* Socket.io */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${status.socketConnected ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">Socket.io</p>
                <p className="text-sm font-semibold text-white">WebSockets</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
              status.socketConnected 
                ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status.socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{status.socketConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
