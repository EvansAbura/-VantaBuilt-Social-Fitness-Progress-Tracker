import React, { useState, useEffect } from 'react';
import { User, NotificationMsg } from '../types';
import { Bell, Award, Users, ChevronDown, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  currentUser: User;
  onUserChanged: (userId: string) => void;
  users: User[];
  notifications: NotificationMsg[];
  onNotificationsRead: () => void;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({
  currentUser,
  onUserChanged,
  users,
  notifications,
  onNotificationsRead,
  triggerRefresh,
  isRefreshing
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-800 bg-[#111114]/90 px-4 py-3 backdrop-blur-md" id="app-header">
      {/* Brand logo */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 bg-black border border-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-neon/5 hover:border-brand-neon/40 transition-colors duration-300">
          <svg viewBox="0 0 500 500" className="w-7 h-7 text-white" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            {/* The Vantabuilt Inverted-Triangle G logo */}
            <path d="M 130 140 H 370 L 350 175 H 180 L 250 286 L 268 252 H 318 L 250 360 L 130 140 Z" />
            <path d="M 238 252 H 288 L 268 286 H 218 L 238 252 Z" />
            <path d="M 338 185 L 305 235 H 240 L 220 205 H 318 Z" opacity="0.9" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-xl font-black tracking-tighter text-white uppercase sm:text-2xl">
            VANTABUILT<span className="text-brand-neon">.</span>
          </h1>
          <p className="hidden text-[9px] text-gray-400 font-mono uppercase tracking-widest sm:block">GYM & CARDIO COLLAB</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3">
        {/* Refresh button */}
        <button
          onClick={triggerRefresh}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-all duration-200"
          title="Sync Feed with Server"
          id="btn-sync"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-brand-cyan' : ''}`} />
        </button>

        {/* Global XP counter */}
        <div className="flex items-center space-x-1.5 rounded-full bg-gray-800/85 px-3 py-1.5 text-xs font-semibold text-brand-neon border border-brand-neon/10" id="xp-counter">
          <Award className="h-4 w-4 text-brand-neon" />
          <span>{currentUser.xp} <span className="text-gray-400 text-[10px]">XP</span></span>
        </div>

        {/* Notifications Icon with unread badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileSwitcher(false);
            }}
            className="relative p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-800 transition-all"
            id="notifications-bell"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-coral text-[9px] font-bold text-white ring-2 ring-[#12141c]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown menu */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 z-20 w-80 rounded-xl border border-gray-800 bg-gray-900 p-2 shadow-2xl"
                  id="notifications-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
                    <span className="font-display text-sm font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          onNotificationsRead();
                        }}
                        className="flex items-center space-x-1 text-xs text-brand-cyan hover:underline hover:text-brand-cyan/85"
                        id="btn-mark-read"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`border-b border-gray-800/50 px-3 py-2.5 last:border-0 transition ${
                            notif.read ? 'opacity-60 bg-transparent' : 'bg-brand-cyan/5 hover:bg-brand-cyan/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-gray-200">{notif.title}</span>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-300 leading-relaxed">{notif.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile / Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileSwitcher(!showProfileSwitcher);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-1.5 rounded-full bg-gray-800 hover:bg-gray-700/80 p-1 pr-3 border border-gray-700 transition"
            id="profile-switcher-btn"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-base shadow-inner">
              {currentUser.avatar}
            </span>
            <span className="hidden max-w-20 truncate text-xs font-medium text-white md:block">
              {currentUser.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          <AnimatePresence>
            {showProfileSwitcher && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileSwitcher(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 z-20 w-56 rounded-xl border border-gray-800 bg-gray-900 p-1.5 shadow-2xl"
                  id="profile-switcher-menu"
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-brand-neon font-mono uppercase tracking-wider border-b border-gray-800">
                    Switch Active Friend Role
                  </div>
                  <div className="py-1 space-y-0.5">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onUserChanged(u.id);
                          setShowProfileSwitcher(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                          u.id === currentUser.id
                            ? 'bg-brand-neon/10 text-brand-neon font-semibold'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{u.avatar}</span>
                          <span className="truncate max-w-[124px]">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">{u.xp} XP</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
