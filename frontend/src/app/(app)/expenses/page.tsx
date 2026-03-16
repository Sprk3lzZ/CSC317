"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ArrowUpDown, X, Calendar, DollarSign, FileText, Tag } from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { getExpenses, createExpense } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Expense } from "@/lib/types";

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const CATEGORIES = [
  { label: "Travel", value: "travel" },
  { label: "Meals", value: "meals" },
  { label: "Software", value: "software" },
  { label: "Hardware", value: "hardware" },
  { label: "Office", value: "office" },
  { label: "Training", value: "training" },
  { label: "Other", value: "other" },
];

type SortKey = "date" | "amount" | "title";
type SortDir = "asc" | "desc";

const INITIAL_FORM = {
  title: "",
  amount: "",
  category: "other",
  notes: "",
  expense_date: new Date().toISOString().split("T")[0],
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getExpenses().then(setExpenses);
  }, []);

  const filtered = expenses
    .filter((e) => {
      if (activeTab !== "all" && e.status !== activeTab) return false;
      if (
        search &&
        !e.title.toLowerCase().includes(search.toLowerCase()) &&
        !e.id.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      if (sortKey === "amount") cmp = a.amount - b.amount;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      return sortDir === "asc" ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  async function handleSubmit() {
    if (!form.title || !form.amount) return;
    setSubmitting(true);
    try {
      const expense = await createExpense({
        title: form.title,
        amount: parseFloat(form.amount),
        currency: "USD",
        category: form.category,
        expense_date: form.expense_date,
        notes: form.notes || null,
      });
      setExpenses((prev) => [expense, ...prev]);
      setForm(INITIAL_FORM);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Expenses</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {expenses.length} total expense{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--primary-gradient)" }}
        >
          <Plus size={15} /> New Expense
        </button>
      </div>

      {/* Search */}
      <div
        className="flex w-full max-w-xs items-center gap-2 rounded-lg border px-3 h-9"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <Search size={13} style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search by title or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
          style={{ color: "var(--text-primary)" }}
        />
        {search && (
          <button onClick={() => setSearch("")}>
            <X size={12} style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "all" ? expenses.length : expenses.filter((e) => e.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", activeTab === tab.value ? "text-white" : "hover:bg-white/5")}
              style={activeTab === tab.value ? { background: "var(--primary-gradient)" } : { color: "var(--text-secondary)" }}
            >
              {tab.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px]"
                style={{
                  background: activeTab === tab.value ? "rgba(255,255,255,0.2)" : "var(--bg-overlay)",
                  color: activeTab === tab.value ? "white" : "var(--text-muted)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b px-5 py-3 text-xs font-medium uppercase tracking-wider"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <span>ID</span>
          <button onClick={() => toggleSort("title")} className="flex items-center gap-1 text-left hover:opacity-70">
            Title <ArrowUpDown size={11} />
          </button>
          <span>Category</span>
          <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:opacity-70">
            Date <ArrowUpDown size={11} />
          </button>
          <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 hover:opacity-70">
            Amount <ArrowUpDown size={11} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: "var(--text-muted)" }}>
            <FileText size={32} className="opacity-30" />
            <p className="text-sm">No expenses found</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
            {filtered.map((expense) => (
              <motion.div
                key={expense.id}
                variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.25 } } }}
                className="group grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b px-5 py-3.5 transition-colors hover:bg-white/[0.03] last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{expense.id.slice(0, 8)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{expense.title}</p>
                  <StatusBadge status={expense.status} className="mt-1" />
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs capitalize" style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
                  {expense.category}
                </span>
                <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{formatDate(expense.expense_date)}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(expense.amount)}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg rounded-2xl border p-6 shadow-2xl"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow-md)" }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>New Expense</h2>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 transition-colors hover:bg-white/5" style={{ color: "var(--text-muted)" }}>
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    <FileText size={12} /> Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flight to NYC"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      <DollarSign size={12} /> Amount (USD)
                    </label>
                    <input
                      type="number" placeholder="0.00" min="0" step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      <Calendar size={12} /> Date
                    </label>
                    <input
                      type="date"
                      value={form.expense_date}
                      onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)", colorScheme: "dark" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    <Tag size={12} /> Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    <FileText size={12} /> Notes
                  </label>
                  <textarea
                    placeholder="Optional details..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>

                <div
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-sm transition-colors hover:bg-white/[0.03]"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
                >
                  <span className="text-lg">+</span>
                  <span>Attach receipt (coming soon)</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.title || !form.amount}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: "var(--primary-gradient)" }}
                >
                  {submitting ? "Submitting..." : "Submit Expense"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
