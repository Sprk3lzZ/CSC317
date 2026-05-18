"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_NOTIFICATIONS = [
  { id: 1, message: "Your expense #EXP-042 was approved", time: "2m ago", read: false },
  { id: 2, message: "New expense submitted for review", time: "1h ago", read: false },
  { id: 3, message: "Monthly report is ready", time: "3h ago", read: true },
];

const dropdownVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.1 } },
};

export function Topbar() {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "??";

  return (
    <header className="flex h-14 items-center gap-4 border-b border-zinc-100 bg-white px-4 shrink-0">
      {/* Search */}
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 h-8 max-w-xs transition-colors focus-within:border-zinc-400 focus-within:bg-white">
        <Search size={13} className="text-zinc-400" />
        <input
          type="text"
          placeholder="Search expenses..."
          className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        <kbd className="hidden sm:flex items-center gap-0.5 rounded px-1.5 text-[10px] font-medium text-zinc-400 bg-zinc-100">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-0.5 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            aria-label="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-zinc-900" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-zinc-200 bg-white shadow-md overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="divide-y divide-zinc-100">
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 ${!n.read ? "bg-zinc-50" : ""}`}
                    >
                      <div
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-zinc-900"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-800 leading-snug">{n.message}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative ml-1">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-zinc-700">
              {user ? `${user.first_name} ${user.last_name}` : ""}
            </span>
            <ChevronDown size={12} className="text-zinc-400" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-zinc-200 bg-white shadow-md overflow-hidden py-1"
              >
                {[
                  { icon: User, label: "Profile" },
                  { icon: Settings, label: "Settings" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
                <div className="my-1 h-px mx-3 bg-zinc-100" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
