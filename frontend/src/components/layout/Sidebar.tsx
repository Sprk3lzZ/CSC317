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
      animate={{ width: collapsed ? 56 : 216 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-full flex-col border-r overflow-hidden shrink-0 bg-white"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-3.5 gap-3 shrink-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
          <Wallet size={14} className="text-white" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold whitespace-nowrap tracking-tight text-zinc-900"
            >
              ExpenseFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-3 h-px shrink-0 bg-zinc-100" />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <motion.div
              key={href}
              whileHover={active ? {} : { scale: 1.02 }}
              transition={{ duration: 0.12 }}
            >
              <Link
                href={href}
                className={cn(
                  "group relative flex h-8 items-center gap-2.5 rounded-lg px-2 text-sm transition-colors duration-150",
                  active ? "text-white" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-zinc-900"
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                {!active && (
                  <span className="absolute inset-0 rounded-lg transition-colors duration-150 group-hover:bg-zinc-50" />
                )}
                <Icon size={15} className="relative shrink-0 z-10" />
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.12 }}
                      className="relative z-10 whitespace-nowrap font-medium text-[13px]"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {collapsed && (
                  <div className="pointer-events-none absolute left-full ml-2.5 z-50 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-900 opacity-0 shadow-sm group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {label}
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 w-full items-center justify-center border-t border-zinc-100 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </motion.aside>
  );
}
