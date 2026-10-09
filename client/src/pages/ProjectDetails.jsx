import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, deleteProject } from '../services/projectService';
import { getProjectTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { TeamMembers } from '../components/TeamMembers';
import { TaskCard } from '../components/TaskCard';
import { TaskFormModal } from '../components/TaskFormModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { ProjectFiles } from '../components/ProjectFiles';
import { ProjectChat } from '../components/ProjectChat';
import { ProjectAssistant } from '../components/ProjectAssistant';
import { ProjectMeeting } from '../components/ProjectMeeting';
import { FolderKanban, Calendar, Crown, Edit, Trash2, ArrowLeft, Loader2, AlertCircle, Shield, CheckSquare, Plus, ArrowRight, Clock, CheckCircle2, PenTool } from 'lucide-react';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const [projData, tasksData] = await Promise.all([
        getProject(id),
        getProjectTasks(id)
      ]);

      if (projData && projData.success && projData.project) {
        setProject(projData.project);
        setIsOwner(projData.isOwner);
      }

      if (tasksData && tasksData.success) {
        setTasks(tasksData.tasks || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      fetchProjectAndTasks();
    }
  };

  const handleTaskFormSubmit = async (formData) => {
    if (editingTask) {
      const data = await updateTask(editingTask._id, formData);
      if (data && data.success && data.task) {
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? data.task : t)));
      }
    } else {
      const data = await createTask(id, formData);
      if (data && data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-indigo-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm text-slate-400">Loading project details & task counts...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error || 'Project not found or access denied.'}</span>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Projects</span>
        </Link>
      </div>
    );
  }

  const ownerInfo = project.owner || {};

  const formattedStartDate = project.startDate
    ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  const formattedDueDate = project.dueDate
    ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date';

  // Task Summary Counts
  const totalTasks = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'Todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const reviewCount = tasks.filter((t) => t.status === 'Review').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${project._id}/board`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <CheckSquare className="w-4 h-4" />
            <span>View Kanban Board</span>
          </Link>
          <Link to={`/projects/${project._id}/whiteboard`} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"><PenTool className="h-4 w-4 text-indigo-400"/><span>Whiteboard</span></Link>

          {isOwner && (
            <>
              <Link
                to={`/projects/${project._id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-indigo-400" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Details Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase font-semibold px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300">
                {project.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {project._id}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {project.title}
            </h1>
          </div>

          {/* Owner Identity Pill */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center gap-3 self-start md:self-auto">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Project Owner</p>
              <p className="text-xs font-bold text-white">{ownerInfo.name || 'Owner'}</p>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            About Project
          </h3>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* Metadata Schedule Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-700/60">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Start Date</p>
              <p className="text-sm font-semibold text-white">{formattedStartDate}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Due Date</p>
              <p className="text-sm font-semibold text-white">{formattedDueDate}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Your Authorization</p>
              <p className="text-sm font-semibold text-white">{isOwner ? 'Project Owner (Full Control)' : 'Team Member'}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Phase 4 Task Management Metrics & Overview */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Project Task Management
              </h3>
              <p className="text-xs text-slate-400">Live task counts and Kanban workflow summary</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>

            <Link
              to={`/projects/${project._id}/board`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors"
            >
              <span>View Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Task Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-center">
            <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Total Tasks</p>
            <p className="text-xl font-extrabold text-white mt-1">{totalTasks}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-center">
            <p className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">Todo</p>
            <p className="text-xl font-extrabold text-indigo-300 mt-1">{todoCount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-center">
            <p className="text-[10px] font-mono text-amber-400 uppercase font-semibold">In Progress</p>
            <p className="text-xl font-extrabold text-amber-300 mt-1">{inProgressCount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-center">
            <p className="text-[10px] font-mono text-purple-400 uppercase font-semibold">Review</p>
            <p className="text-xl font-extrabold text-purple-300 mt-1">{reviewCount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Completed</p>
            <p className="text-xl font-extrabold text-emerald-300 mt-1">{completedCount}</p>
          </div>
        </div>

        {/* Tasks Preview List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recent Project Tasks</h4>
          {tasks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.slice(0, 4).map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={(t) => {
                    setSelectedTask(t);
                    setIsDetailsOpen(true);
                  }}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center text-xs text-slate-400 space-y-2">
              <p>No tasks created for this project yet.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Task</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Team Members Section */}
      <TeamMembers
        project={project}
        isOwner={isOwner}
        onProjectUpdate={(updatedProj) => setProject(updatedProj)}
      />

      <ProjectFiles projectId={project._id} isOwner={isOwner} />
      <ProjectChat projectId={project._id} />
      <ProjectAssistant projectId={project._id} />
      <ProjectMeeting projectId={project._id} isOwner={isOwner} />

      {/* Task Form & Details Modals */}
      <TaskFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleTaskFormSubmit}
        task={editingTask}
        members={project?.members || []}
      />

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        isOwner={isOwner}
        onEditClick={(t) => {
          setEditingTask(t);
          setIsFormOpen(true);
        }}
        onDeleteClick={handleDeleteTask}
        onStatusChange={handleStatusChange}
      />

    </div>
  );
};

export default ProjectDetails;
