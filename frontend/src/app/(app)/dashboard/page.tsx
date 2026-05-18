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
import { StatCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { getDashboardStats, getCategorySpend, getExpenses } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { formatCurrency, formatRelativeDate, currencySymbol } from "@/lib/utils";
import { useMileageSettings } from "@/lib/useMileageSettings";
import type { DashboardStats, CategorySpend, Expense } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  travel:   "#18181b",
  meals:    "#52525b",
  software: "#3b82f6",
  hardware: "#16a34a",
  training: "#f59e0b",
  office:   "#dc2626",
  other:    "#a1a1aa",
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
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-zinc-900">{CATEGORY_LABELS[label ?? ""] ?? label}</p>
      <p className="text-zinc-500">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const mileageSettings = useMileageSettings();
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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56 mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-3 space-y-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2 space-y-3">
            <Skeleton className="h-4 w-28" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Welcome back{user ? `, ${user.first_name}` : ""}.{" "}
          {user?.role === "employee"
            ? "Here’s your expense overview."
            : user?.role === "manager"
            ? "Here’s your team’s expense overview."
            : "Here’s the company-wide expense overview."}
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Expenses" value={stats.total_count} icon={Receipt} iconColor="#18181b" delay={0} />
        <StatCard label={user?.role === "employee" ? "Awaiting Review" : "To Review"} value={stats.pending_count} icon={Clock} iconColor="#f59e0b" delay={0.06} />
        <StatCard label="Approved" value={stats.approved_count} icon={CheckCircle} iconColor="#16a34a" delay={0.12} />
        <StatCard label="Pending Amount" value={Math.round(stats.pending_amount ?? 0)} prefix={currencySymbol(mileageSettings.currency)} icon={Wallet} iconColor="#3b82f6" delay={0.18} />
      </motion.div>

      {/* Charts + Recent */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Category chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Spend by Category</h2>
              <p className="text-xs text-zinc-400">All time</p>
            </div>
            <TrendingUp size={15} className="text-zinc-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={categorySpend.map((c) => ({ ...c, name: c.category }))}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tickFormatter={(v) => CATEGORY_LABELS[v] ?? v}
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {categorySpend.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? "#a1a1aa"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent expenses */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2"
        >
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Recent Expenses</h2>
          <div className="space-y-3">
            {recentExpenses.length === 0 && (
              <p className="text-sm text-zinc-400 py-4 text-center">No expenses yet</p>
            )}
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{expense.title}</p>
                  <p className="text-xs text-zinc-400">{formatRelativeDate(expense.expense_date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-zinc-900">
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
