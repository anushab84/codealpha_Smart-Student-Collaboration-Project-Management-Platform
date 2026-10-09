import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfileApi, updateProfileApi } from '../services/api';
import { User, Mail, Shield, Calendar, Edit3, CheckCircle2, AlertCircle, Loader2, Save, X, Image as ImageIcon } from 'lucide-react';

export const Profile = () => {
  const { currentUser, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profileImage: ''
  });

  // Fetch complete profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getProfileApi();
        if (data && data.success && data.user) {
          setProfile(data.user);
          setEditForm({
            name: data.user.name || '',
            bio: data.user.bio || '',
            profileImage: data.user.profileImage || ''
          });
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to load profile details'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!editForm.name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty' });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await updateProfileApi(editForm);
      if (data && data.success) {
        setProfile(data.user);
        updateUser(data.user); // Sync global auth context
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Unable to update profile'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-slate-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Alert Messages */}
      {message.text && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
            : 'bg-rose-950/60 border-rose-800 text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-slate-400 hover:text-white text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        
        {/* Banner Header */}
        <div className="h-32 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 relative">
          <div className="absolute right-6 top-6">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white font-medium text-xs border border-slate-700 backdrop-blur-md transition-all cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 pb-8 pt-0 relative">
          
          {/* Avatar Icon */}
          <div className="-mt-16 mb-6 flex items-end justify-between">
            <div className="relative">
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-24 h-24 rounded-2xl border-4 border-slate-800 object-cover shadow-lg bg-slate-900"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = ''; // Fallback to icon
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-slate-800 bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>

          {!isEditing ? (
            /* View Profile Mode */
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{profile?.name}</h1>
                <p className="text-sm text-indigo-400 font-mono mt-0.5">{profile?.email}</p>
              </div>

              {/* Bio Section */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Student Bio
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {profile?.bio || 'No bio provided yet. Click "Edit Profile" to add your student details and interests.'}
                </p>
              </div>

              {/* Account Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Account Role</p>
                    <p className="text-sm font-semibold text-white capitalize">{profile?.role || 'student'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Member Since</p>
                    <p className="text-sm font-semibold text-white">{formattedDate}</p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Edit Profile Form Mode */
            <form onSubmit={handleSaveProfile} className="space-y-5 pt-2">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <h2 className="text-lg font-bold text-white">Edit Profile Details</h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Bio / Student Summary
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  value={editForm.bio}
                  onChange={handleEditChange}
                  placeholder="Share your major, skills, repository links, or project interests..."
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Profile Image URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Profile Image URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    name="profileImage"
                    value={editForm.profileImage}
                    onChange={handleEditChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Readonly Fields Info */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40 text-xs text-slate-400">
                Email address (<span className="text-slate-300">{profile?.email}</span>) and Role (<span className="text-slate-300">{profile?.role}</span>) are system identifiers and cannot be modified directly.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};

export default Profile;
