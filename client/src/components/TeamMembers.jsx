import React, { useState } from 'react';
import { searchUsers, addMember, removeMember } from '../services/projectService';
import { Users, UserPlus, Trash2, Search, Crown, Shield, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

export const TeamMembers = ({ project, isOwner, onProjectUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setFeedback({ type: '', text: '' });
      const data = await searchUsers(searchQuery);
      if (data && data.success) {
        setSearchResults(data.users || []);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Search failed' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setIsActionLoading(true);
      setFeedback({ type: '', text: '' });
      const data = await addMember(project._id, userId);
      if (data && data.success) {
        setFeedback({ type: 'success', text: data.message });
        setSearchQuery('');
        setSearchResults([]);
        setShowAddModal(false);
        if (onProjectUpdate) onProjectUpdate(data.project);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add member'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this project team?`)) {
      return;
    }

    try {
      setIsActionLoading(true);
      setFeedback({ type: '', text: '' });
      const data = await removeMember(project._id, userId);
      if (data && data.success) {
        setFeedback({ type: 'success', text: data.message });
        if (onProjectUpdate) onProjectUpdate(data.project);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove member'
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Check if a user is already in the project members list
  const isUserMember = (targetUserId) => {
    return project?.members?.some((m) => {
      const uId = m.user?._id || m.user;
      return uId.toString() === targetUserId.toString();
    });
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      
      {/* Header & Add Button */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Team Members
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                {project?.members?.length || 1}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Collaborators assigned to this project</p>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback.text && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          feedback.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
            : 'bg-rose-950/60 border-rose-800 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', text: '' })}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Member List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {project?.members?.map((m) => {
          const u = m.user || {};
          const isProjectOwner = project.owner?._id
            ? project.owner._id.toString() === u._id?.toString()
            : project.owner?.toString() === u._id?.toString();

          return (
            <div
              key={u._id || Math.random()}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {u.profileImage ? (
                  <img src={u.profileImage} alt={u.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-sm font-semibold text-white truncate">{u.name || 'Member'}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isProjectOwner ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-semibold">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Owner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold">
                    <Shield className="w-3 h-3 text-indigo-400" />
                    {m.role || 'Member'}
                  </span>
                )}

                {/* Remove member button for project owner */}
                {isOwner && !isProjectOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(u._id, u.name)}
                    disabled={isActionLoading}
                    title={`Remove ${u.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Search Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Add Team Member
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search registered students by name or email..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Search Results List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pt-2">
              {searchResults.length > 0 ? (
                searchResults.map((user) => {
                  const alreadyAdded = isUserMember(user._id);

                  return (
                    <div
                      key={user._id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-white truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      {alreadyAdded ? (
                        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-lg">
                          Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddMember(user._id)}
                          disabled={isActionLoading}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Add to Team
                        </button>
                      )}
                    </div>
                  );
                })
              ) : searchQuery && !isSearching ? (
                <p className="text-xs text-slate-400 text-center py-4">No registered students found matching "{searchQuery}"</p>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Type a student's name or email to search registered users.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TeamMembers;
