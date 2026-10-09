import React from 'react';
import { Layers, Code2 } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/80 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">CollabHub</span>
            <span className="text-xs text-slate-500 font-mono">— Project collaboration workspace</span>
          </div>

          <div className="text-xs text-slate-400 text-center sm:text-right flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Built for Student Project Collaboration & Teamwork</span>
          </div>

        </div>
      </div>
    </footer>
  );
};
