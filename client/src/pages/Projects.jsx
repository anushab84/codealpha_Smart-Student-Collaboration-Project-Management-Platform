import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/projectService';
import { ProjectCard } from '../components/ProjectCard';
import { FolderKanban, Plus, Filter, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProjects();
      if (data && data.success) {
        setProjects(data.projects || []);
        setFilteredProjects(data.projects || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProjects();
  }, []);

  // Filter projects by status tab
  useEffect(() => {
    if (activeTab === 'All') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter((p) => p.status === activeTab));
    }
  }, [activeTab, projects]);

  const tabs = ['All', 'Active', 'Planning', 'Completed', 'Archived'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Create Project CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Projects & team collaboration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-indigo-500" />
            My Projects
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, manage, and collaborate on student team projects.
          </p>
        </div>

        <Link
          to="/projects/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Create Project</span>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {tabs.map((tab) => {
          const count = tab === 'All' ? projects.length : projects.filter((p) => p.status === tab).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === tab ? 'bg-indigo-700 text-white' : 'bg-slate-900 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchUserProjects}
            className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Projects Grid / States */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-indigo-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading your project workspace...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-indigo-400 flex items-center justify-center mx-auto border border-slate-700">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No projects found</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {activeTab === 'All'
                ? "You haven't created or joined any projects yet."
                : `There are no projects with "${activeTab}" status.`}
            </p>
          </div>
          <Link
            to="/projects/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Project</span>
          </Link>
        </div>
      )}

    </div>
  );
};

export default Projects;
