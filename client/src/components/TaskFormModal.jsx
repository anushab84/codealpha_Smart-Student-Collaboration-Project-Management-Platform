import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Loader2, Save } from 'lucide-react';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const TaskFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  members = [],
  defaultStatus = 'Todo'
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    status: defaultStatus,
    dueDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sync form data when task or defaultStatus changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        priority: task.priority || 'Medium',
        status: task.status || defaultStatus,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium',
        status: defaultStatus,
        dueDate: ''
      });
    }
    setError('');
  }, [task, defaultStatus, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!formData.title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (formData.title.trim().length > 150) {
      setError('Task title cannot exceed 150 characters.');
      return;
    }
    if (formData.description && formData.description.length > 2000) {
      setError('Task description cannot exceed 2000 characters.');
      return;
    }
    if (!STATUSES.includes(formData.status)) {
      setError('Please select a valid status.');
      return;
    }
    if (!PRIORITIES.includes(formData.priority)) {
      setError('Please select a valid priority level.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {task ? 'Edit Task' : 'Create New Task'}
              </h3>
              <p className="text-xs text-slate-400">
                {task
                  ? 'Update the task assignment, priority, status, and milestone details.'
                  : 'Add a new task card to the project Kanban board.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
            {error}
          </div>
        )}

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Design Login Page UI, Create API Auth Route..."
              required
              maxLength={150}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
            <p className="text-[10px] text-slate-500 mt-1 text-right">
              {formData.title.length}/150
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Task Description{' '}
              <span className="text-slate-500 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              id="task-description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide implementation details, sub-goals, design criteria, or acceptance criteria..."
              maxLength={2000}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none placeholder:text-slate-500"
            />
            <p className="text-[10px] text-slate-500 mt-1 text-right">
              {formData.description.length}/2000
            </p>
          </div>

          {/* Assignee & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Assign To (restricted to project members) */}
            <div>
              <label htmlFor="task-assignedTo" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Assign To Member
              </label>
              <select
                id="task-assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Unassigned —</option>
                {members.map((m) => {
                  const u = m.user || m;
                  if (!u?._id) return null;
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name || 'Unknown'}{u.email ? ` (${u.email})` : ''}
                      {m.role ? ` · ${m.role}` : ''}
                    </option>
                  );
                })}
              </select>
              {members.length === 0 && (
                <p className="text-[10px] text-slate-500 mt-1">
                  No project members found. Add members to the project first.
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="task-priority" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Priority Level
              </label>
              <select
                id="task-priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Status & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Status */}
            <div>
              <label htmlFor="task-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Kanban Column Status
              </label>
              <select
                id="task-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="task-dueDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Due Date{' '}
                <span className="text-slate-500 normal-case font-normal">(optional)</span>
              </label>
              <input
                id="task-dueDate"
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{task ? 'Update Task' : 'Create Task'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default TaskFormModal;
