import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { Layers, Menu, X, Newspaper, Search, CalendarDays, ChartNoAxesCombined, ShieldCheck, LayoutDashboard, FolderKanban, LogOut, LogIn, UserPlus } from 'lucide-react';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', public: false },
    { name: 'Projects', icon: FolderKanban, path: '/projects', public: false },
    { name: 'Feed', icon: Newspaper, path: '/feed', public: false },
    { name: 'Search', icon: Search, path: '/search', public: false },
    { name: 'Calendar', icon: CalendarDays, path: '/calendar', public: false },
    { name: 'Analytics', icon: ChartNoAxesCombined, path: '/analytics', public: false },
    { name: 'Admin', icon: ShieldCheck, path: '/admin', public: false, admin: true }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 text-white">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                CollabHub
                <span className="text-[10px] font-semibold tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded-full">
                  FULL STACK
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (!item.public && !isAuthenticated) return null;
              if (item.admin && currentUser?.role !== 'admin') return null;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <NotificationBell />
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{currentUser?.name}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log out of your account"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <LogIn className="w-4 h-4 text-indigo-400" />
                  <span>Log In</span>
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 mb-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-white">{currentUser?.name}</p>
                  <p className="text-xs text-indigo-400 font-mono">{currentUser?.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                >
                  Profile
                </Link>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                <span className="font-medium text-sm">Dashboard</span>
              </Link>

              <Link
                to="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <FolderKanban className="w-5 h-5 text-indigo-400" />
                <span className="font-medium text-sm">Projects</span>
              </Link>

              <Link
                to="/feed"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <Newspaper className="w-5 h-5 text-indigo-400" />
                <span className="font-medium text-sm">Feed</span>
              </Link>

              <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"><Search className="w-5 h-5 text-indigo-400" /><span className="font-medium text-sm">Search</span></Link>
              <Link to="/calendar" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"><CalendarDays className="w-5 h-5 text-indigo-400" /><span className="font-medium text-sm">Calendar</span></Link>
              <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"><ChartNoAxesCombined className="w-5 h-5 text-indigo-400" /><span className="font-medium text-sm">Analytics</span></Link>
              {currentUser?.role === 'admin' && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800"><ShieldCheck className="w-5 h-5 text-rose-400" /><span className="font-medium text-sm">Admin</span></Link>}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-400 hover:bg-slate-800 text-left font-medium text-sm"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-medium text-sm"
              >
                <LogIn className="w-4 h-4 text-indigo-400" />
                <span>Log In</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
