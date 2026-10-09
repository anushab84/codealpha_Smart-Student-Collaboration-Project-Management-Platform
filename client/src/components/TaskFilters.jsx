import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

export const TaskFilters = ({ filters, onFilterChange, members = [] }) => {
  const { status, priority, assignee, search } = filters;

  const handleChange = (e) => {
    onFilterChange({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleReset = () => {
    onFilterChange({
      status: 'All',
      priority: 'All',
      assignee: 'All',
      search: ''
    });
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-md backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      
      {/* Search Input */}
      <div className="relative flex-grow max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          name="search"
          value={search}
          onChange={handleChange}
          placeholder="Search tasks by title or description..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mr-1">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Filters:</span>
        </div>

        {/* Status */}
        <select
          name="status"
          value={status}
          onChange={handleChange}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Review">Review</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Priority */}
        <select
          name="priority"
          value={priority}
          onChange={handleChange}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Assignee */}
        <select
          name="assignee"
          value={assignee}
          onChange={handleChange}
          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Members</option>
          <option value="Unassigned">Unassigned</option>
          {members.map((m) => {
            const u = m.user || m;
            return (
              <option key={u._id} value={u._id}>
                {u.name || u.email}
              </option>
            );
          })}
        </select>

        {/* Reset Filters */}
        {(status !== 'All' || priority !== 'All' || assignee !== 'All' || search !== '') && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset filters"
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};

export default TaskFilters;
