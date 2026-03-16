"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Receipt, Clock, CheckCircle, Wallet, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDashboardStats, getCategorySpend, getExpenses } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import type { DashboardStats, CategorySpend, Expense } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  travel:   "#6366f1",
  meals:    "#8b5cf6",
  software: "#3b82f6",
  hardware: "#10b981",
  training: "#f59e0b",
  office:   "#ef4444",
  other:    "#6b7280",
};

const CATEGORY_LABELS: Record<string, string> = {
  travel: "Travel", meals: "Meals", software: "Software",
  hardware: "Hardware", training: "Training", office: "Office", other: "Other",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-lg"
      style={{ background: "var(--bg-overlay)", borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
    >
      <p className="font-medium">{CATEGORY_LABELS[label ?? ""] ?? label}</p>
      <p style={{ color: "var(--text-secondary)" }}>{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats);
    getCategorySpend().then(setCategorySpend);
    getExpenses().then((expenses) =>
      setRecentExpenses(
        [...expenses]
          .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
          .slice(0, 5)
      )
    );
  }, []);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--primary-500)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Welcome back{user ? `, ${user.first_name}` : ""}.{" "}
          {user?.role === "employee"
            ? "Here\u2019s your expense overview."
            : user?.role === "manager"
            ? "Here\u2019s your team\u2019s expense overview."
            : "Here\u2019s the company-wide expense overview."}
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Expenses" value={stats.total_count} icon={Receipt} iconColor="var(--primary-500)" delay={0} />
        <StatCard label={user?.role === "employee" ? "Awaiting Review" : "To Review"} value={stats.pending_count} icon={Clock} iconColor="var(--status-under-review)" delay={0.08} />
        <StatCard label="Approved" value={stats.approved_count} icon={CheckCircle} iconColor="var(--status-approved)" delay={0.16} />
        <StatCard label="Pending Amount" value={Math.round(stats.pending_amount)} prefix="$" icon={Wallet} iconColor="var(--status-submitted)" delay={0.24} />
      </motion.div>

      {/* Charts + Recent */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Category spend chart */}
        <motion.div variants={itemVariants} className="glass rounded-2xl p-5 lg:col-span-3" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Spend by Category</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>All time</p>
            </div>
            <TrendingUp size={16} style={{ color: "var(--text-muted)" }} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categorySpend.map((c) => ({ ...c, name: c.category }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tickFormatter={(v) => CATEGORY_LABELS[v] ?? v} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {categorySpend.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent expenses */}
        <motion.div variants={itemVariants} className="glass rounded-2xl p-5 lg:col-span-2" style={{ boxShadow: "var(--shadow-sm)" }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Expenses</h2>
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{expense.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatRelativeDate(expense.expense_date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(expense.amount)}
                  </span>
                  <StatusBadge status={expense.status} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
