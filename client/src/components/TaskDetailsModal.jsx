import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TaskDiscussion } from './TaskDiscussion';
import {
  X, Calendar, User, Shield, Edit, Trash2,
  Clock, AlertTriangle, AlertOctagon, CheckCircle2,
  FolderOpen, RefreshCw
} from 'lucide-react';

const PRIORITY_META = {
  Urgent: { color: 'bg-rose-950 border-rose-700 text-rose-300', icon: AlertOctagon },
  High:   { color: 'bg-amber-950 border-amber-700 text-amber-300', icon: AlertTriangle },
  Medium: { color: 'bg-indigo-950 border-indigo-700 text-indigo-300', icon: Clock },
  Low:    { color: 'bg-slate-900 border-slate-700 text-slate-400', icon: CheckCircle2 }
};

const STATUS_META = {
  'Todo':        { color: 'bg-indigo-950 border-indigo-700 text-indigo-300' },
  'In Progress': { color: 'bg-amber-950 border-amber-700 text-amber-300' },
  'Review':      { color: 'bg-purple-950 border-purple-700 text-purple-300' },
  'Completed':   { color: 'bg-emerald-950 border-emerald-700 text-emerald-300' }
};

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];

export const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
  isOwner,
  onEditClick,
  onDeleteClick,
  onStatusChange
}) => {
  const { currentUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  const {
    _id, title, description, priority, status,
    assignedTo, createdBy, dueDate, createdAt, updatedAt,
    project
  } = task;

  const isCreator = createdBy?._id
    ? createdBy._id.toString() === currentUser?._id?.toString()
    : createdBy?.toString() === currentUser?._id?.toString();

  const canDelete = isOwner || isCreator;
  const canEdit = true; // All project members can edit (backend enforces project membership)

  const formatDate = (dateStr, fallback = 'N/A') => {
    if (!dateStr) return fallback;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formattedDueDate = formatDate(dueDate, 'No due date');
  const formattedCreatedDate = formatDate(createdAt);
  const formattedUpdatedDate = formatDate(updatedAt);

  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'Completed';

  const priorityMeta = PRIORITY_META[priority] || PRIORITY_META.Medium;
  const PriorityIcon = priorityMeta.icon;
  const statusMeta = STATUS_META[status] || { color: 'bg-slate-900 border-slate-700 text-slate-300' };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    try {
      setIsDeleting(true);
      await onDeleteClick(_id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete task');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-4">
        
        {/* Header: Badges + Actions */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-700 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full border ${statusMeta.color}`}>
              {status}
            </span>
            {/* Priority Badge */}
            <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${priorityMeta.color}`}>
              <PriorityIcon className="w-3 h-3" />
              Priority: {priority}
            </span>
            {/* Overdue warning */}
            {isOverdue && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border bg-rose-950 border-rose-700 text-rose-300 uppercase">
                ⚠ Overdue
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEditClick(task)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1 font-semibold transition-colors"
                title="Edit Task"
              >
                <Edit className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 text-xs flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                title="Delete Task"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Title & Description */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{title}</h2>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/60 min-h-[80px]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</p>
            <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
              {description || 'No detailed description provided.'}
            </p>
          </div>
        </div>

        {/* Status Change Controls */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Move to Status:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onStatusChange(_id, st)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === st
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Meta Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700 text-xs">
          
          {/* Assigned User */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center gap-2.5">
            <User className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] mb-0.5">Assigned To</p>
              <div className="flex items-center gap-1.5">
                {assignedTo ? (
                  <>
                    {assignedTo.profileImage ? (
                      <img
                        src={assignedTo.profileImage}
                        alt={assignedTo.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold">
                        {assignedTo.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="font-semibold text-white">{assignedTo.name}</p>
                  </>
                ) : (
                  <p className="font-medium text-slate-400 italic">Unassigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            isOverdue
              ? 'bg-rose-950/30 border-rose-800/60'
              : 'bg-slate-900/50 border-slate-700/50'
          }`}>
            <Calendar className={`w-4 h-4 shrink-0 ${isOverdue ? 'text-rose-400' : 'text-indigo-400'}`} />
            <div>
              <p className="text-slate-400 text-[11px] mb-0.5">Due Date</p>
              <p className={`font-semibold ${isOverdue ? 'text-rose-300' : 'text-white'}`}>
                {formattedDueDate}
              </p>
            </div>
          </div>

          {/* Created By */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] mb-0.5">Created By</p>
              <p className="font-semibold text-white">{createdBy?.name || 'System'}</p>
            </div>
          </div>

          {/* Created Date */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] mb-0.5">Created</p>
              <p className="font-semibold text-white">{formattedCreatedDate}</p>
            </div>
          </div>

          {/* Project */}
          {project && typeof project === 'object' && project.title && (
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center gap-2.5 sm:col-span-2">
              <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-slate-400 text-[11px] mb-0.5">Project</p>
                <p className="font-semibold text-white">{project.title}</p>
              </div>
            </div>
          )}

          {/* Last Updated */}
          {updatedAt && updatedAt !== createdAt && (
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center gap-2.5 sm:col-span-2">
              <RefreshCw className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-slate-400 text-[11px] mb-0.5">Last Updated</p>
                <p className="font-semibold text-slate-300">{formattedUpdatedDate}</p>
              </div>
            </div>
          )}
        </div>

        <TaskDiscussion taskId={_id} />

      </div>
    </div>
  );
};

export default TaskDetailsModal;
