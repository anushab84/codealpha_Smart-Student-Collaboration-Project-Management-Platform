import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject } from '../services/projectService';
import { getProjectTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { TaskColumn } from '../components/TaskColumn';
import { TaskFilters } from '../components/TaskFilters';
import { TaskFormModal } from '../components/TaskFormModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { FolderKanban, Plus, ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const TaskBoard = () => {
  const { id: projectId } = useParams();

  const [project, setProject] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All',
    assignee: 'All',
    search: ''
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultColumnStatus, setDefaultColumnStatus] = useState('Todo');

  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch Project & Tasks
  const loadBoardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [projData, tasksData] = await Promise.all([
        getProject(projectId),
        getProjectTasks(projectId)
      ]);

      if (projData && projData.success) {
        setProject(projData.project);
        setIsOwner(projData.isOwner);
      }

      if (tasksData && tasksData.success) {
        setTasks(tasksData.tasks || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load task board data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [projectId]);

  // Handle status update (Drag-and-drop or select dropdown)
  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    if (selectedTask && selectedTask._id === taskId) {
      setSelectedTask((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      const data = await updateTask(taskId, { status: newStatus });
      if (data && data.success && data.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? data.task : t))
        );
        // Keep selectedTask in sync
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (err) {
      // Revert on error by refreshing
      loadBoardData();
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  // Create or Update task submit handler
  const handleFormSubmit = async (formData) => {
    if (editingTask) {
      const data = await updateTask(editingTask._id, formData);
      if (data && data.success && data.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTask._id ? data.task : t))
        );
        // Update selectedTask if it was the edited task
        if (selectedTask && selectedTask._id === editingTask._id) {
          setSelectedTask(data.task);
        }
      }
    } else {
      const data = await createTask(projectId, formData);
      if (data && data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
      }
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    if (selectedTask && selectedTask._id === taskId) {
      setIsDetailsOpen(false);
      setSelectedTask(null);
    }
  };

  // Apply filters & search to tasks list
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (filters.status !== 'All' && t.status !== filters.status) return false;

      // Priority filter
      if (filters.priority !== 'All' && t.priority !== filters.priority) return false;

      // Assignee filter
      if (filters.assignee !== 'All') {
        if (filters.assignee === 'Unassigned') {
          if (t.assignedTo) return false;
        } else {
          const aId = t.assignedTo?._id || t.assignedTo;
          if (aId?.toString() !== filters.assignee) return false;
        }
      }

      // Search query
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Group tasks by Kanban column status
  const columnsData = {
    Todo: filteredTasks.filter((t) => t.status === 'Todo'),
    'In Progress': filteredTasks.filter((t) => t.status === 'In Progress'),
    Review: filteredTasks.filter((t) => t.status === 'Review'),
    Completed: filteredTasks.filter((t) => t.status === 'Completed')
  };

  // Build a deduplicated members list for the form (includes owner + all members)
  const projectMembers = useMemo(() => {
    if (!project) return [];
    const members = project.members || [];
    
    // Check if owner is already in members list
    const ownerInMembers = members.some(
      (m) => (m.user?._id || m.user)?.toString() === project.owner?._id?.toString()
    );

    // If owner not in members array, add them at the front
    if (!ownerInMembers && project.owner) {
      return [{ user: project.owner, role: 'Owner' }, ...members];
    }
    return members;
  }, [project]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-indigo-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading project Kanban board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4 text-center">
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={loadBoardData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project Details</span>
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FolderKanban className="w-7 h-7 text-indigo-500" />
              {project?.title} — Kanban Board
            </h1>
          </div>

          {/* Task count summary strip */}
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { label: 'Total', count: tasks.length, color: 'text-white' },
              { label: 'Todo', count: columnsData.Todo.length, color: 'text-indigo-300' },
              { label: 'In Progress', count: columnsData['In Progress'].length, color: 'text-amber-300' },
              { label: 'Review', count: columnsData.Review.length, color: 'text-purple-300' },
              { label: 'Completed', count: columnsData.Completed.length, color: 'text-emerald-300' },
            ].map(({ label, count, color }) => (
              <span key={label} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {label}: <span className={`font-bold ${color}`}>{count}</span>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setDefaultColumnStatus('Todo');
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <TaskFilters
        filters={filters}
        onFilterChange={setFilters}
        members={projectMembers}
      />

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="p-10 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center space-y-3">
          <p className="text-base font-semibold text-slate-300">No tasks yet</p>
          <p className="text-xs text-slate-400">Create your first task to start managing this project on the Kanban board.</p>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setDefaultColumnStatus('Todo');
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Task</span>
          </button>
        </div>
      )}

      {/* Kanban Columns Grid — Responsive & horizontally scrollable */}
      {tasks.length > 0 && (
        <div className="w-full overflow-x-auto pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[768px]">
            {['Todo', 'In Progress', 'Review', 'Completed'].map((colStatus) => (
              <TaskColumn
                key={colStatus}
                status={colStatus}
                tasks={columnsData[colStatus]}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsDetailsOpen(true);
                }}
                onStatusChange={handleStatusChange}
                onAddTaskClick={(status) => {
                  setEditingTask(null);
                  setDefaultColumnStatus(status);
                  setIsFormOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show columns even when tasks is empty (after filters result in 0 tasks) */}
      {tasks.length > 0 && filteredTasks.length === 0 && (
        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center text-xs text-slate-400">
          No tasks match the current filters.{' '}
          <button
            type="button"
            onClick={() => setFilters({ status: 'All', priority: 'All', assignee: 'All', search: '' })}
            className="text-indigo-400 hover:text-indigo-300 underline ml-1"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        task={editingTask}
        members={projectMembers}
        defaultStatus={defaultColumnStatus}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        isOwner={isOwner}
        onEditClick={(taskToEdit) => {
          setIsDetailsOpen(false);
          setEditingTask(taskToEdit);
          setIsFormOpen(true);
        }}
        onDeleteClick={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />

    </div>
  );
};

export default TaskBoard;
