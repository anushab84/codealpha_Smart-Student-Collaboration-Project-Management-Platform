import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, Calendar, ArrowRight, Shield } from 'lucide-react';

export const ProjectCard = ({ project }) => {
  const { _id, title, description, status, owner, members, startDate, dueDate } = project;

  // Status color styles
  const getStatusBadge = (statusName) => {
    switch (statusName) {
      case 'Active':
        return 'bg-emerald-950/80 border-emerald-700 text-emerald-400';
      case 'Planning':
        return 'bg-indigo-950/80 border-indigo-700 text-indigo-300';
      case 'Completed':
        return 'bg-sky-950/80 border-sky-700 text-sky-400';
      case 'Archived':
        return 'bg-slate-900 border-slate-700 text-slate-400';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date';

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl shadow-slate-950/40 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between group">
      
      <div>
        {/* Header Badge & Title */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className={`text-[10px] uppercase font-mono font-semibold px-2.5 py-1 rounded-full border ${getStatusBadge(status)}`}>
              {status}
            </span>
          </div>

          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {formattedDueDate}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
          {title}
        </h3>

        <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {description}
        </p>
      </div>

      {/* Footer Info & Team Avatars */}
      <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
        
        {/* Team Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 overflow-hidden">
            {members && members.slice(0, 4).map((m, idx) => {
              const u = m.user || {};
              return (
                <div
                  key={u._id || idx}
                  title={`${u.name || 'Member'} (${m.role || 'Member'})`}
                  className="w-7 h-7 rounded-full border-2 border-slate-800 bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm"
                >
                  {u.profileImage ? (
                    <img src={u.profileImage} alt={u.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (u.name ? u.name.charAt(0).toUpperCase() : 'M')
                  )}
                </div>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {members?.length || 1} {members?.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* View Project Link */}
        <Link
          to={`/projects/${_id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>View Project</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

      </div>

    </div>
  );
};

export default ProjectCard;
