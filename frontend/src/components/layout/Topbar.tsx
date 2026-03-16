"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, Sun, Moon, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

const MOCK_NOTIFICATIONS = [
  { id: 1, message: "Your expense #EXP-042 was approved", time: "2m ago", read: false },
  { id: 2, message: "New expense submitted for review", time: "1h ago", read: false },
  { id: 3, message: "Monthly report is ready", time: "3h ago", read: true },
];

export function Topbar() {
  const { theme, toggle } = useTheme();
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

  return (
    <header
      className="flex h-14 items-center gap-4 border-b px-4 shrink-0"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Search */}
      <div
        className="flex flex-1 items-center gap-2 rounded-lg border px-3 h-8 max-w-sm"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <Search size={13} style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search expenses..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
          style={{ color: "var(--text-primary)" }}
        />
        <kbd
          className="hidden sm:flex items-center gap-0.5 rounded px-1.5 text-[10px] font-medium"
          style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}
        >
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-[color:var(--primary-500)]" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 top-10 z-50 w-80 rounded-xl border shadow-lg overflow-hidden"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-strong)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ background: "var(--primary-500)" }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={cn("flex gap-3 px-4 py-3", !n.read && "bg-[color:var(--primary-500)]/5")}
                  >
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-[color:var(--primary-500)]"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {n.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative ml-1">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: "var(--primary-gradient)" }}
            >
              {user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "??"}
            </div>
            <span className="hidden sm:block text-sm" style={{ color: "var(--text-primary)" }}>
              {user ? `${user.first_name} ${user.last_name}` : ""}
            </span>
            <ChevronDown size={12} />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 top-10 z-50 w-48 rounded-xl border shadow-lg overflow-hidden py-1"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-strong)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {[
                { icon: User, label: "Profile" },
                { icon: Settings, label: "Settings" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
              <div className="my-1 h-px mx-3" style={{ background: "var(--border)" }} />
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ color: "var(--status-rejected)" }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
