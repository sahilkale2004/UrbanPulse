import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';
import { supabase } from '../../services/supabaseClient';
import { io } from 'socket.io-client';

// ── Avatar helper ─────────────────────────────────────────────────────────────
// Returns a Google photo URL (if the user signed in with Google) or null.
function useGoogleAvatar() {
  const [avatarUrl, setAvatarUrl] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.avatar_url) {
        setAvatarUrl(session.user.user_metadata.avatar_url);
      }
    });
  }, []);
  return avatarUrl;
}

// ── Initials circle ───────────────────────────────────────────────────────────
const PALETTE = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6'];
function InitialsAvatar({ name, size = 36 }) {
  const letter = (name || 'U')[0].toUpperCase();
  const color  = PALETTE[letter.charCodeAt(0) % PALETTE.length];
  return (
    <div
      style={{ width: size, height: size, background: color, fontSize: size * 0.42, flexShrink: 0 }}
      className="rounded-full flex items-center justify-center font-black text-white select-none border-2 border-white/30 shadow-sm"
    >
      {letter}
    </div>
  );
}

export default function Navbar() {
  const location      = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const isDashboard   = ['/dashboard', '/ward-management', '/issue'].some(p => location.pathname.startsWith(p));
  const googleAvatar  = useGoogleAvatar();

  const [notifications, setNotifications]   = useState([]);
  const [showBellDrop,  setShowBellDrop]    = useState(false);
  const [showProfile,   setShowProfile]     = useState(false);
  const [isMobileOpen,  setIsMobileOpen]    = useState(false);

  const bellRef    = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ── Socket + notifications ───────────────────────────────────────────────
  useEffect(() => {
    let socket;
    if (isAuthenticated && user) {
      notificationService.getNotifications()
        .then(res => { if (res.success) setNotifications(res.data); })
        .catch(err => console.error('Notif fetch error', err));

      socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
      socket.on('connect', () => socket.emit('join', user.id));
      socket.on('new_notification', ({ notification }) =>
        setNotifications(prev => [notification, ...prev])
      );
    }
    return () => { if (socket) socket.disconnect(); };
  }, [isAuthenticated, user]);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current    && !bellRef.current.contains(e.target))    setShowBellDrop(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMobileOpen(false); }, [location.pathname]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch(err) { console.error('Mark read failed', err); }
  };

  const navLinks = !isDashboard ? [
    { to: '/',                  label: 'Home' },
    { to: '/report',            label: 'Report Issue' },
    { to: '/my-reports',        label: 'My Reports' },
    { to: '/map',               label: 'Risk Map' },
    { to: '/completed-projects',label: 'Completed Projects' },
    { to: '/dashboard',         label: 'Municipal Dashboard', authorityOnly: true },
  ] : [
    { to: '/dashboard',         label: 'Dashboard' },
    { to: '/ward-management',   label: 'Ward Management' },
  ];

  // ── Avatar element (shared) ──────────────────────────────────────────────
  const AvatarEl = ({ size = 36 }) =>
    googleAvatar
      ? <img src={googleAvatar} alt="avatar" referrerPolicy="no-referrer"
             style={{ width: size, height: size }} className="rounded-full object-cover border-2 border-white/30 shadow-sm" />
      : <InitialsAvatar name={user?.name} size={size} />;

  return (
    <header className={`${isDashboard ? 'bg-white border-b border-slate-200' : 'bg-brand-dark text-white'} h-16 shrink-0 fixed w-full top-0 z-[999] transition-colors`}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6 max-w-7xl mx-auto">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 mr-4 md:mr-10">
          <div className="flex items-end space-x-[3px] h-6 text-blue-500">
            <div className="w-[5px] h-3 bg-blue-400 rounded-sm"></div>
            <div className="w-[5px] bg-blue-500 rounded-sm" style={{ height: '18px' }}></div>
            <div className="w-[5px] h-6 bg-blue-600 rounded-sm"></div>
          </div>
          <span className={`text-xl font-bold tracking-tight ${isDashboard ? 'text-slate-900' : 'text-white'} ml-1 whitespace-nowrap`}>
            UrbanPulse
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-1 h-full">
          {navLinks.map(link => {
            if (link.authorityOnly && isAuthenticated && user?.role !== 'authority' && user?.role !== 'admin') return null;
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}
                className={`px-3 h-full flex items-center text-sm font-medium transition-colors ${
                  isDashboard
                    ? (isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-900')
                    : (isActive ? 'text-brand-light border-b-2 border-brand-light' : 'text-slate-300 hover:text-white')
                }`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">

          {/* ── NOT logged in ── */}
          {!isAuthenticated && !isDashboard && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="hidden sm:flex text-sm font-semibold text-slate-300 hover:text-white items-center px-2">
                Log In
              </Link>
              <Link to="/register" className="bg-brand-light text-brand-dark px-4 sm:px-6 py-2 rounded-full text-sm font-semibold hover:bg-teal-300 transition-colors shadow-lg whitespace-nowrap text-center">
                Sign Up
              </Link>
            </div>
          )}

          {/* ── Logged in ── */}
          {isAuthenticated && (
            <>
              {/* Bell */}
              {!isDashboard && (
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={() => { setShowBellDrop(v => !v); setShowProfile(false); }}
                    className={`relative h-9 w-9 flex items-center justify-center rounded-full transition-colors ${isDashboard ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-brand-light/20'}`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </button>

                  {showBellDrop && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[1000]">
                      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0
                          ? <div className="p-6 text-center text-sm text-slate-500">No notifications yet.</div>
                          : <div className="divide-y divide-slate-100">
                              {notifications.map(n => (
                                <div key={n._id} onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                                  className={`p-4 transition-colors cursor-pointer ${n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}>
                                  <p className={`text-sm ${n.isRead ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>{n.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{new Date(n.createdAt).toLocaleDateString()}</p>
                                </div>
                              ))}
                            </div>
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Profile Avatar Button + Popup ── */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => { setShowProfile(v => !v); setShowBellDrop(false); }}
                  className="h-9 w-9 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-brand-light/60 transition-transform hover:scale-105"
                  title="Profile"
                >
                  <AvatarEl size={34} />
                </button>

                {showProfile && (
                  <div className="fixed left-1/2 -translate-x-1/2 top-[68px] w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1000]">
                    {/* Profile header */}
                    <div className="bg-gradient-to-br from-brand-dark to-slate-800 px-4 py-3 flex items-center gap-3">
                      <AvatarEl size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight truncate">{user?.name || 'User'}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest bg-brand-light/20 text-brand-light border border-brand-light/30 px-2 py-0.5 rounded-full">
                          {user?.role || 'citizen'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileOpen(v => !v)}
            className={`md:hidden h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${isDashboard ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-brand-light/20'}`}
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-900/50 backdrop-blur-sm z-[998]" onClick={() => setIsMobileOpen(false)}>
          <div className="absolute right-4 top-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
            <div className="bg-gradient-to-br from-brand-dark to-slate-800 px-4 py-5 flex flex-col items-center gap-2">
              {isAuthenticated
                ? <>
                    <AvatarEl size={48} />
                    <p className="text-white font-bold text-sm text-center">{user?.name || 'User'}</p>
                    <p className="text-slate-400 text-[10px] text-center break-all">{user?.email}</p>
                    <span className="text-[10px] font-black uppercase bg-brand-light/20 text-brand-light px-3 py-0.5 rounded-full border border-brand-light/30">{user?.role}</span>
                  </>
                : <div className="flex items-center gap-2 text-white">
                    <User className="w-6 h-6" />
                    <span className="font-bold">Guest Visitor</span>
                  </div>
              }
            </div>

            {/* Nav links */}
            <nav className="p-2">
              {navLinks.map(link => {
                if (link.authorityOnly && isAuthenticated && user?.role !== 'authority' && user?.role !== 'admin') return null;
                const isActive = location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth actions */}
            <div className="p-3 mt-auto border-t border-slate-100">
              {!isAuthenticated
                ? <div className="flex flex-col gap-2">
                    <Link to="/login"    className="w-full py-2.5 text-center text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl">Log In</Link>
                    <Link to="/register" className="w-full py-2.5 text-center text-sm font-bold bg-blue-600 text-white rounded-xl shadow-md">Create Account</Link>
                  </div>
                : <button onClick={logout} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
              }
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


