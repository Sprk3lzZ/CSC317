"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/components/AuthProvider";
import { getExpenses, approveExpense, rejectExpense } from "@/lib/api";
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";

type ConfirmAction = { expense: Expense; action: "approved" | "rejected" } | null;

export default function ApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const pending = expenses.filter((e) => e.status === "pending");
  const reviewed = expenses.filter((e) => e.status === "approved" || e.status === "rejected");

  useEffect(() => {
    if (user && user.role === "employee") {
      router.replace("/dashboard");
      return;
    }
    getExpenses().then(setExpenses);
  }, [user, router]);

  async function handleAction(expense: Expense, action: "approved" | "rejected") {
    setProcessing(expense.id);
    try {
      const updated =
        action === "approved"
          ? await approveExpense(expense.id)
          : await rejectExpense(expense.id);
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } finally {
      setProcessing(null);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Approvals
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {pending.length} expense{pending.length !== 1 ? "s" : ""} awaiting your review
        </p>
      </div>

      {/* Pending queue */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Pending Review
        </h2>

        {pending.length === 0 ? (
          <div
            className="glass flex flex-col items-center justify-center gap-3 rounded-2xl py-16"
            style={{ color: "var(--text-muted)" }}
          >
            <CheckCircle size={36} className="opacity-30" />
            <p className="text-sm">All caught up — no pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pending.map((expense, i) => (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.97 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}
                  className="glass rounded-2xl p-5"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                          {expense.id}
                        </span>
                        <StatusBadge status={expense.status} />
                      </div>
                      <p className="mt-1 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                        {expense.title}
                      </p>
                      <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {expense.notes}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Submitted {formatRelativeDate(expense.created_at ?? expense.expense_date)}
                        </span>
                        <span>Date: {formatDate(expense.expense_date)}</span>
                        <span className="capitalize">Category: {expense.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span
                        className="text-xl font-bold tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatCurrency(expense.amount)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirm({ expense, action: "rejected" })}
                          disabled={processing === expense.id}
                          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5 disabled:opacity-40"
                          style={{
                            borderColor: "var(--status-rejected)",
                            color: "var(--status-rejected)",
                          }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                        <button
                          onClick={() => setConfirm({ expense, action: "approved" })}
                          disabled={processing === expense.id}
                          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                          style={{ background: "var(--status-approved)" }}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Recently reviewed */}
      {reviewed.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Recently Reviewed
          </h2>
          <div
            className="glass rounded-2xl overflow-hidden"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {reviewed.map((expense, i) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-4 border-b px-5 py-3.5 last:border-0 transition-colors hover:bg-white/[0.03]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {expense.title}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {expense.id.slice(0, 8)} · {formatDate(expense.expense_date)}
                  </p>
                </div>
                <StatusBadge status={expense.status} />
                <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-2xl"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-strong)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background:
                      confirm.action === "approved"
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(239,68,68,0.15)",
                  }}
                >
                  <AlertTriangle
                    size={18}
                    style={{
                      color:
                        confirm.action === "approved"
                          ? "var(--status-approved)"
                          : "var(--status-rejected)",
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {confirm.action === "approved" ? "Approve expense?" : "Reject expense?"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {confirm.expense.title}
                  </p>
                </div>
              </div>
              <p className="mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
                {confirm.action === "approved"
                  ? `You are approving ${formatCurrency(confirm.expense.amount)} for reimbursement.`
                  : "The submitter will be notified that this expense was rejected."}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(confirm.expense, confirm.action)}
                  disabled={processing === confirm.expense.id}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{
                    background:
                      confirm.action === "approved"
                        ? "var(--status-approved)"
                        : "var(--status-rejected)",
                  }}
                >
                  {processing ? "Processing..." : confirm.action === "approved" ? "Approve" : "Reject"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
