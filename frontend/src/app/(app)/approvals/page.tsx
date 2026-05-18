"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock } from "lucide-react";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/components/AuthProvider";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getExpenses, approveExpense, rejectExpense } from "@/lib/api";
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/utils";
import type { Expense } from "@/lib/types";

type ConfirmAction = { expense: Expense; action: "approved" | "rejected" } | null;

export default function ApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const pending = expenses.filter((e) => e.status === "pending");
  const reviewed = expenses.filter((e) => e.status === "approved" || e.status === "rejected");

  useEffect(() => {
    if (user && user.role === "employee") {
      router.replace("/dashboard");
      return;
    }
    getExpenses().then((data) => { setExpenses(data); setLoadingExpenses(false); });
  }, [user, router]);

  async function handleAction(expense: Expense, action: "approved" | "rejected") {
    setProcessing(expense.id);
    try {
      const updated = action === "approved" ? await approveExpense(expense.id) : await rejectExpense(expense.id);
      setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } finally {
      setProcessing(null);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Approvals</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          {pending.length} expense{pending.length !== 1 ? "s" : ""} awaiting your review
        </p>
      </motion.div>

      {/* Pending queue */}
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Pending Review
        </h2>

        {loadingExpenses ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-16 text-zinc-400">
            <CheckCircle size={32} className="opacity-30" />
            <p className="text-sm">All caught up — no pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pending.map((expense, i) => (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16, scale: 0.98 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                  whileHover={{ y: -1, transition: { duration: 0.15 } }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] text-zinc-400">{expense.id.slice(0, 8)}</span>
                        <StatusBadge status={expense.status} />
                      </div>
                      <p className="mt-1.5 text-base font-semibold text-zinc-900">{expense.title}</p>
                      {expense.notes && (
                        <p className="mt-0.5 text-sm text-zinc-500">{expense.notes}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Submitted {formatRelativeDate(expense.created_at ?? expense.expense_date)}
                        </span>
                        <span>Date: {formatDate(expense.expense_date)}</span>
                        <span className="capitalize">Category: {expense.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className="text-xl font-bold tabular-nums text-zinc-900">
                        {formatCurrency(expense.amount)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirm({ expense, action: "rejected" })}
                          disabled={processing === expense.id}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                        <button
                          onClick={() => setConfirm({ expense, action: "approved" })}
                          disabled={processing === expense.id}
                          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                          <CheckCircle size={12} /> Approve
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
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Recently Reviewed
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {reviewed.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-4 border-b border-zinc-50 px-5 py-3.5 last:border-0 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{expense.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {expense.id.slice(0, 8)} · {formatDate(expense.expense_date)}
                  </p>
                </div>
                <StatusBadge status={expense.status} />
                <span className="text-sm font-semibold tabular-nums shrink-0 text-zinc-900">
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${confirm.action === "approved" ? "bg-emerald-50" : "bg-red-50"}`}>
                  {confirm.action === "approved"
                    ? <CheckCircle size={17} className="text-emerald-600" />
                    : <XCircle size={17} className="text-red-600" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {confirm.action === "approved" ? "Approve expense?" : "Reject expense?"}
                  </p>
                  <p className="text-xs text-zinc-500">{confirm.expense.title}</p>
                </div>
              </div>
              <p className="mb-5 text-sm text-zinc-600">
                {confirm.action === "approved"
                  ? `You are approving ${formatCurrency(confirm.expense.amount)} for reimbursement.`
                  : "The submitter will be notified that this expense was rejected."}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(confirm.expense, confirm.action)}
                  disabled={processing === confirm.expense.id}
                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 ${confirm.action === "approved" ? "bg-emerald-600" : "bg-red-600"}`}
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
