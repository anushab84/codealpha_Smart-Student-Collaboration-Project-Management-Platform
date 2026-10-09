import React from 'react';
import {
  Calendar, AlertOctagon, AlertTriangle, Clock,
  CheckCircle2, ChevronRight
} from 'lucide-react';

const PRIORITY_META = {
  Urgent: {
    color: 'bg-rose-950/80 border-rose-800 text-rose-300',
    icon: AlertOctagon
  },
  High: {
    color: 'bg-amber-950/80 border-amber-800 text-amber-300',
    icon: AlertTriangle
  },
  Medium: {
    color: 'bg-indigo-950/80 border-indigo-700 text-indigo-300',
    icon: Clock
  },
  Low: {
    color: 'bg-slate-900 border-slate-700 text-slate-400',
    icon: CheckCircle2
  }
};

export const TaskCard = ({ task, onClick, onStatusChange }) => {
  const { _id, title, description, priority, status, assignedTo, dueDate } = task;

  const priorityMeta = PRIORITY_META[priority] || PRIORITY_META.Medium;
  const PriorityIcon = priorityMeta.icon;

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  // Overdue: has a due date, not completed, and the date is in the past
  const isOverdue = dueDate
    && status !== 'Completed'
    && new Date(dueDate) < new Date();

  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', _id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(task)}
      className={`bg-slate-900/90 border rounded-xl p-4 shadow-md hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer group space-y-3 ${
        isOverdue
          ? 'border-rose-800/60 hover:border-rose-600/60'
          : 'border-slate-700/70 hover:border-indigo-500/60'
      }`}
    >
      {/* Priority Badge & Quick Status Select */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${priorityMeta.color}`}
          aria-label={`Priority: ${priority}`}
        >
          <PriorityIcon className="w-3 h-3" />
          <span>Priority: {priority}</span>
        </span>

        {/* Status quick select — prevents card click propagation */}
        {onStatusChange && (
          <select
            value={status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(_id, e.target.value);
            }}
            className="text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            aria-label="Change task status"
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>
        )}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
        {title}
      </h4>

      {/* Description Snippet */}
      {description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {/* Overdue indicator */}
      {isOverdue && (
        <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-rose-400">
          <AlertOctagon className="w-3 h-3" />
          <span>OVERDUE</span>
        </div>
      )}

      {/* Footer: Assignee & Due Date */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        
        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {assignedTo ? (
            <div className="flex items-center gap-1.5" title={`Assigned to ${assignedTo.name}`}>
              {assignedTo.profileImage ? (
                <img
                  src={assignedTo.profileImage}
                  alt={assignedTo.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {assignedTo.name ? assignedTo.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-[11px] text-slate-300 truncate max-w-[90px]">
                {assignedTo.name}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 italic">Unassigned</span>
          )}
        </div>

        {/* Due Date */}
        {formattedDueDate && (
          <div className={`flex items-center gap-1 text-[11px] font-mono ${
            isOverdue ? 'text-rose-400' : 'text-slate-400'
          }`}>
            <Calendar className={`w-3 h-3 ${isOverdue ? 'text-rose-400' : 'text-indigo-400'}`} />
            <span>{formattedDueDate}</span>
          </div>
        )}

      </div>

      {/* Click hint */}
      <div className="flex justify-end">
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  );
};

export default TaskCard;
