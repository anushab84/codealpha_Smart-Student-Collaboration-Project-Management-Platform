import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjectSummary } from '../services/projectService';
import { getDashboardTaskSummary } from '../services/taskService';
import { SystemStatus } from '../components/SystemStatus';
import { ProjectCard } from '../components/ProjectCard';
import { FolderKanban, Plus, Sparkles, ArrowRight, ShieldCheck, CheckSquare, Users, MessageSquare, Loader2, AlertCircle, Clock } from 'lucide-react';

export const Dashboard = () => {
  const { currentUser } = useAuth();

  const [projectSummary, setProjectSummary] = useState({
    totalProjects: 0,
    activeCount: 0,
    planningCount: 0,
    completedCount: 0
  });

  const [taskSummary, setTaskSummary] = useState({
    totalTasks: 0,
    todoCount: 0,
    inProgressCount: 0,
    reviewCount: 0,
    completedCount: 0,
    assignedToMeCount: 0,
    dueSoonCount: 0
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        setError('');
        const [projRes, taskRes] = await Promise.all([
          getProjectSummary(),
          getDashboardTaskSummary()
        ]);

        if (projRes && projRes.success) {
          setProjectSummary(projRes.summary || {});
          setRecentProjects(projRes.recentProjects || []);
        }

        if (taskRes && taskRes.success) {
          setTaskSummary(taskRes.summary || {});
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-900/80 via-slate-800 to-slate-900 border border-indigo-700/50 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Projects, teamwork & collaboration workspace</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-indigo-300">{currentUser?.name || 'Student'}</span>!
            </h1>
            
            <p className="text-sm text-slate-300 max-w-xl">
              Track student project milestones, manage team memberships, and organize tasks on Kanban boards.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
            >
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <span>My Projects</span>
            </Link>

            <Link
              to="/projects/create"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Metrics Row: Projects & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Summary */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            Project Metrics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Projects</p>
              <p className="text-2xl font-extrabold text-white mt-1">{projectSummary.totalProjects || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Active</p>
              <p className="text-2xl font-extrabold text-emerald-300 mt-1">{projectSummary.activeCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">Planning</p>
              <p className="text-2xl font-extrabold text-indigo-300 mt-1">{projectSummary.planningCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-sky-400 uppercase font-semibold">Completed</p>
              <p className="text-2xl font-extrabold text-sky-300 mt-1">{projectSummary.completedCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Task Summary */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Task & Kanban Metrics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Total Tasks</p>
              <p className="text-2xl font-extrabold text-white mt-1">{taskSummary.totalTasks || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-amber-400 uppercase font-semibold">In Progress</p>
              <p className="text-2xl font-extrabold text-amber-300 mt-1">{taskSummary.inProgressCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Due Soon</p>
              <p className="text-2xl font-extrabold text-rose-300 mt-1">{taskSummary.dueSoonCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <p className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">Completed</p>
              <p className="text-2xl font-extrabold text-emerald-300 mt-1">{taskSummary.completedCount || 0}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Recent Projects
          </h2>

          <Link
            to="/projects"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : !loading && (
          <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center space-y-3">
            <p className="text-sm text-slate-400">No active projects found in your database workspace.</p>
            <Link
              to="/projects/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Project</span>
            </Link>
          </div>
        )}
      </div>

      {/* Infrastructure Status */}
      <SystemStatus />

    </div>
  );
};

export default Dashboard;
