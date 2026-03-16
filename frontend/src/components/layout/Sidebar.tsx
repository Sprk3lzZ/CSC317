"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["employee", "manager", "admin"] },
  { href: "/expenses", icon: Receipt, label: "My Expenses", roles: ["employee", "manager", "admin"] },
  { href: "/approvals", icon: CheckSquare, label: "Approvals", roles: ["manager", "admin"] },
  { href: "/settings", icon: Settings, label: "Settings", roles: ["employee", "manager", "admin"] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-full flex-col border-r overflow-hidden shrink-0"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4 gap-3 shrink-0">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--primary-gradient)" }}
        >
          <Wallet size={16} className="text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: "var(--text-primary)" }}
            >
              ExpenseFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px shrink-0" style={{ background: "var(--border)" }} />

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 py-3 flex-1">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                active
                  ? "text-white"
                  : "hover:bg-white/5"
              )}
              style={
                active
                  ? { background: "var(--primary-gradient)", color: "white" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <Icon size={16} className="shrink-0" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div
                  className="pointer-events-none absolute left-full ml-2 z-50 rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg"
                  style={{
                    background: "var(--bg-overlay)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 w-full items-center justify-center border-t transition-colors hover:bg-white/5"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
}
