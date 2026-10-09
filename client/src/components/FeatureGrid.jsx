import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, MessageSquare, Bell, Newspaper, Search, CalendarDays,
  ChartNoAxesCombined, Sparkles, Video, PenTool, ShieldCheck, Server,
  BookOpen, ArrowUpRight
} from 'lucide-react';

const features = [
  { phase: 'Phases 1–4', title: 'Projects, teams & task boards', description: 'Create projects, manage team members, assign work, and track tasks on a Kanban board.', icon: FolderKanban, to: '/projects', state: 'Available' },
  { phase: 'Phase 5', title: 'Discussions & shared files', description: 'Comment on tasks and share private project files with authorized members.', icon: MessageSquare, to: '/projects', state: 'Available' },
  { phase: 'Phase 6', title: 'Project chat', description: 'Persistent project conversations with live delivery and message history.', icon: MessageSquare, to: '/projects', state: 'Available' },
  { phase: 'Phase 7', title: 'Notifications', description: 'See project and task updates in your account notification bell.', icon: Bell, to: '/login', state: 'Sign in' },
  { phase: 'Phase 8', title: 'Community feed', description: 'Publish posts, comment, and like updates from the student community.', icon: Newspaper, to: '/feed', state: 'Available' },
  { phase: 'Phase 9', title: 'Search & calendar', description: 'Find accessible projects, tasks, people, and posts; review task due dates by month.', icon: Search, to: '/search', state: 'Available', secondaryTo: '/calendar', secondaryLabel: 'Calendar' },
  { phase: 'Phase 10', title: 'Project analytics', description: 'Review task progress, overdue work, status distributions, and project completion.', icon: ChartNoAxesCombined, to: '/analytics', state: 'Available' },
  { phase: 'Phase 11', title: 'AI project assistant', description: 'Generate project summaries and planning suggestions. Provider credentials are required.', icon: Sparkles, to: '/projects', state: 'Needs AI setup' },
  { phase: 'Phase 12', title: 'Project meetings', description: 'Join member-only Jitsi meetings. A JWT-enabled Jitsi provider must be configured.', icon: Video, to: '/projects', state: 'Needs meeting setup' },
  { phase: 'Phase 13', title: 'Shared whiteboard', description: 'Draw, add shapes and text, and synchronize a saved board with project members.', icon: PenTool, to: '/projects', state: 'Available' },
  { phase: 'Phase 14', title: 'Administration', description: 'Manage accounts and moderate posts using server-controlled admin access.', icon: ShieldCheck, to: '/admin', state: 'Admin access' },
  { phase: 'Phases 15–18', title: 'Security, deployment & final checks', description: 'Security controls, deployment preparation, documentation, and verification status are recorded in the project README.', icon: Server, state: 'Project documentation' },
];

export const FeatureGrid = () => (
  <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="feature-grid-title">
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">CollabHub workspace</p>
      <h2 id="feature-grid-title" className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Features across all project phases</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">The collaboration features are available after you sign in. AI and video meetings need provider setup; administration is limited to authorized admins.</p>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ phase, title, description, icon: Icon, to, state, secondaryTo, secondaryLabel }) => (
        <article key={phase} className="flex min-h-52 flex-col rounded-2xl border border-slate-700/70 bg-slate-800/50 p-5 transition-colors hover:border-indigo-500/50">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-indigo-300"><Icon size={19} aria-hidden="true" /></div>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">{phase}</span>
          </div>
          <h3 className="mt-4 font-semibold text-white">{title}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-400">{description}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/70 pt-3">
            <span className="text-xs font-medium text-emerald-300">{state}</span>
            <div className="flex items-center gap-3">
              {secondaryTo && <Link to={secondaryTo} className="text-xs font-semibold text-slate-300 hover:text-white">{secondaryLabel}</Link>}
              {to && <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-white">Open <ArrowUpRight size={13} aria-hidden="true" /></Link>}
            </div>
          </div>
        </article>
      ))}
    </div>

    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"><BookOpen size={14} aria-hidden="true" />Phase implementation and verification details are in README.</div>
  </section>
);

export default FeatureGrid;
