"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, ArrowUpDown, X, Calendar, DollarSign, FileText, Tag,
  Navigation, MapPin, ArrowRight, Loader2,
} from "lucide-react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowSkeleton } from "@/components/ui/Skeleton";
import { getExpenses, createExpense, calculateMileage } from "@/lib/api";
import { formatCurrency, formatDate, cn, currencySymbol } from "@/lib/utils";
import { useMileageSettings } from "@/lib/useMileageSettings";
import type { Expense, MileageCalculateResult } from "@/lib/types";

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
  { label: "Mileage", value: "mileage" },
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

const INITIAL_MILEAGE = {
  from: "",
  to: "",
  expense_date: new Date().toISOString().split("T")[0],
  notes: "",
};

// ── Mileage sub-form ──────────────────────────────────────────────────────────

interface MileageFormValues {
  from: string;
  to: string;
  expense_date: string;
  notes: string;
}

interface MileageFormProps {
  form: MileageFormValues;
  onChange: (patch: Partial<MileageFormValues>) => void;
  result: MileageCalculateResult | null;
  calculating: boolean;
  calcError: string | null;
  onCalculate: () => void;
  inputClass: string;
}

function MileageForm({ form, onChange, result, calculating, calcError, onCalculate, inputClass }: MileageFormProps) {
  const canCalculate = form.from.trim().length > 1 && form.to.trim().length > 1;

  const amountDisplay = result
    ? `${currencySymbol(result.currency)}${result.amount.toFixed(2)}`
    : null;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            <MapPin size={11} /> Departure city
          </label>
          <input
            type="text"
            placeholder="e.g. Paris"
            value={form.from}
            onChange={(e) => onChange({ from: e.target.value })}
            className={inputClass}
          />
          <AnimatePresence>
            {result?.from_resolved && (
              <motion.p
                key="from-resolved"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-1 text-[11px] text-zinc-400 leading-snug"
              >
                {result.from_resolved}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            <Navigation size={11} /> Arrival city
          </label>
          <input
            type="text"
            placeholder="e.g. Lyon"
            value={form.to}
            onChange={(e) => onChange({ to: e.target.value })}
            className={inputClass}
          />
          <AnimatePresence>
            {result?.to_resolved && (
              <motion.p
                key="to-resolved"
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-1 text-[11px] text-zinc-400 leading-snug"
              >
                {result.to_resolved}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        onClick={onCalculate}
        disabled={!canCalculate || calculating}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
      >
        {calculating ? (
          <><Loader2 size={14} className="animate-spin" /> Calculating route...</>
        ) : (
          <><ArrowRight size={14} /> Calculate distance &amp; amount</>
        )}
      </button>

      <AnimatePresence>
        {calcError && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
          >
            {calcError}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <p className="mb-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Route summary</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">Distance</p>
                <p className="text-sm font-semibold text-zinc-900">{result.distance.toFixed(1)} {result.unit}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-400">Rate</p>
                <p className="text-sm font-medium text-zinc-600">{result.rate} {result.currency}/{result.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">Reimbursement</p>
                <p className="text-xl font-bold text-zinc-900">{amountDisplay}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
          <Calendar size={11} /> Trip date
        </label>
        <input
          type="date"
          value={form.expense_date}
          onChange={(e) => onChange({ expense_date: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
          <FileText size={11} /> Notes (optional)
        </label>
        <textarea
          placeholder="Purpose of the trip..."
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const mileageSettings = useMileageSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [mileageForm, setMileageForm] = useState(INITIAL_MILEAGE);
  const [mileageResult, setMileageResult] = useState<MileageCalculateResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const isMileage = form.category === "mileage";

  useEffect(() => {
    getExpenses().then((data) => {
      setExpenses(data);
      setLoadingExpenses(false);
    });
  }, []);

  useEffect(() => {
    if (!showModal) {
      setMileageForm(INITIAL_MILEAGE);
      setMileageResult(null);
      setCalcError(null);
    }
  }, [showModal]);

  useEffect(() => {
    setMileageResult(null);
    setCalcError(null);
  }, [form.category]);

  const filtered = expenses
    .filter((e) => {
      if (activeTab !== "all" && e.status !== activeTab) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase()))
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

  async function handleCalculate() {
    if (!mileageForm.from.trim() || !mileageForm.to.trim()) return;
    setCalculating(true);
    setCalcError(null);
    setMileageResult(null);
    try {
      const result = await calculateMileage({
        from: mileageForm.from.trim(),
        to: mileageForm.to.trim(),
      });
      setMileageResult(result);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Could not calculate route");
    } finally {
      setCalculating(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      let payload;
      if (isMileage && mileageResult) {
        payload = {
          title: `Mileage: ${mileageForm.from} → ${mileageForm.to}`,
          amount: mileageResult.amount,
          currency: mileageResult.currency,
          category: "mileage",
          expense_date: mileageForm.expense_date,
          notes: mileageForm.notes || `${mileageResult.distance.toFixed(1)} ${mileageResult.unit}`,
          departure_city: mileageForm.from,
          arrival_city: mileageForm.to,
          distance: mileageResult.distance,
          distance_unit: mileageResult.unit,
        };
      } else {
        if (!form.title || !form.amount) return;
        payload = {
          title: form.title,
          amount: parseFloat(form.amount),
          currency: "USD",
          category: form.category,
          expense_date: form.expense_date,
          notes: form.notes || null,
        };
      }
      const expense = await createExpense(payload);
      setExpenses((prev) => [expense, ...prev]);
      setForm(INITIAL_FORM);
      setMileageForm(INITIAL_MILEAGE);
      setMileageResult(null);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = isMileage ? !!mileageResult && !submitting : !!form.title && !!form.amount && !submitting;

  const inputClass = "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white placeholder:text-zinc-400";

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">My Expenses</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {expenses.length} total expense{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> New Expense
        </button>
      </motion.div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 h-8 max-w-xs flex-1 min-w-[180px] transition-colors focus-within:border-zinc-400">
          <Search size={13} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-zinc-600">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === "all" ? expenses.length : expenses.filter((e) => e.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 h-6 text-xs font-medium transition-all",
                  activeTab === tab.value ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                {tab.label}
                <span className={cn(
                  "rounded-full px-1.5 py-px text-[10px] font-medium",
                  activeTab === tab.value ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-zinc-100 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          <span>ID</span>
          <button onClick={() => toggleSort("title")} className="flex items-center gap-1 text-left hover:text-zinc-700 transition-colors">
            Title <ArrowUpDown size={10} />
          </button>
          <span>Category</span>
          <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-zinc-700 transition-colors">
            Date <ArrowUpDown size={10} />
          </button>
          <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 hover:text-zinc-700 transition-colors">
            Amount <ArrowUpDown size={10} />
          </button>
        </div>

        {loadingExpenses ? (
          <div>
            {[0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
            <FileText size={28} className="opacity-40" />
            <p className="text-sm">No expenses found</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
          >
            {filtered.map((expense) => (
              <motion.div
                key={expense.id}
                variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0, transition: { duration: 0.2 } } }}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-zinc-50 px-5 py-3.5 transition-colors hover:bg-zinc-50 last:border-0"
              >
                <span className="font-mono text-[11px] text-zinc-400">{expense.id.slice(0, 8)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{expense.title}</p>
                  <StatusBadge status={expense.status} className="mt-1" />
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 capitalize">
                  {expense.category}
                </span>
                <span className="text-sm text-zinc-500 tabular-nums">{formatDate(expense.expense_date)}</span>
                <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatCurrency(expense.amount)}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* New Expense Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-x-4 top-[8%] z-50 mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl overflow-y-auto max-h-[88vh]"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-zinc-900">New Expense</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category — always first */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                    <Tag size={11} /> Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                {isMileage ? (
                  <MileageForm
                    form={mileageForm}
                    onChange={(patch) => setMileageForm((f) => ({ ...f, ...patch }))}
                    result={mileageResult}
                    calculating={calculating}
                    calcError={calcError}
                    onCalculate={handleCalculate}
                    inputClass={inputClass}
                  />
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                        <FileText size={11} /> Title
                      </label>
                      <input type="text" placeholder="e.g. Flight to NYC" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                          <DollarSign size={11} /> Amount ({mileageSettings.currency})
                        </label>
                        <input type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                          <Calendar size={11} /> Date
                        </label>
                        <input type="date" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                        <FileText size={11} /> Notes
                      </label>
                      <textarea
                        placeholder="Optional details..."
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={3}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-zinc-200 py-5 text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
                      <span className="text-base">+</span>
                      <span>Attach receipt (coming soon)</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
