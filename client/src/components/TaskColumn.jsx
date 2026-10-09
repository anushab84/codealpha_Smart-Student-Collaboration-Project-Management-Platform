import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Plus, CheckSquare, Clock, ArrowRightCircle, CheckCircle2, Inbox } from 'lucide-react';

const COLUMN_META = {
  'Todo': {
    title: 'TODO',
    color: 'text-indigo-400 border-indigo-500/50 bg-indigo-950/40',
    badge: 'bg-indigo-950 text-indigo-300 border-indigo-700',
    ring: 'ring-indigo-500/30',
    icon: Clock
  },
  'In Progress': {
    title: 'IN PROGRESS',
    color: 'text-amber-400 border-amber-500/50 bg-amber-950/40',
    badge: 'bg-amber-950 text-amber-300 border-amber-700',
    ring: 'ring-amber-500/30',
    icon: ArrowRightCircle
  },
  'Review': {
    title: 'REVIEW',
    color: 'text-purple-400 border-purple-500/50 bg-purple-950/40',
    badge: 'bg-purple-950 text-purple-300 border-purple-700',
    ring: 'ring-purple-500/30',
    icon: CheckSquare
  },
  'Completed': {
    title: 'COMPLETED',
    color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    ring: 'ring-emerald-500/30',
    icon: CheckCircle2
  }
};

export const TaskColumn = ({ status, tasks = [], onTaskClick, onStatusChange, onAddTaskClick }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const meta = COLUMN_META[status] || {
    title: status.toUpperCase(),
    color: 'text-slate-300 border-slate-700 bg-slate-900',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    ring: 'ring-slate-500/30',
    icon: Clock
  };

  const StatusIcon = meta.icon;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onStatusChange) {
      onStatusChange(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-800/60 border rounded-2xl p-4 flex flex-col transition-all duration-200 min-h-[420px] ${
        isDragOver
          ? `border-indigo-500 bg-indigo-950/20 ring-2 ${meta.ring}`
          : 'border-slate-700/60'
      }`}
    >

      {/* Column Header */}
      <div className={`p-3 rounded-xl border flex items-center justify-between mb-4 ${meta.color}`}>
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4" aria-hidden="true" />
          <h3 className="font-bold text-xs tracking-wider">{meta.title}</h3>
        </div>

        <span
          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}
          aria-label={`${tasks.length} tasks`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task Cards Stack */}
      <div className="flex-1 space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={onTaskClick}
              onStatusChange={onStatusChange}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 border border-dashed border-slate-700/60 rounded-xl text-xs gap-2 min-h-[180px]">
            <Inbox className="w-6 h-6 text-slate-600" aria-hidden="true" />
            <p>No tasks</p>
            <p className="text-[10px] text-slate-600">Drag a card here or add a new task</p>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button
        type="button"
        onClick={() => onAddTaskClick(status)}
        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors cursor-pointer"
        aria-label={`Add task to ${status}`}
      >
        <Plus className="w-4 h-4 text-indigo-400" />
        <span>Add Task</span>
      </button>

    </div>
  );
};

export default TaskColumn;
