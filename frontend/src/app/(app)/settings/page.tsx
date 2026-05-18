"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Building2, ShieldCheck, Tag, Navigation } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getMileageSettings, saveMileageSettings } from "@/lib/api";
import { invalidateMileageSettings } from "@/lib/useMileageSettings";
import { currencySymbol } from "@/lib/utils";

const CATEGORY_LIMITS_DEFAULT: Record<string, number> = {
  travel: 5000,
  meals: 500,
  software: 2000,
  hardware: 1500,
  office: 300,
  training: 1000,
  other: 500,
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section variants={itemVariants}>
      <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">{children}</div>
    </motion.section>
  );
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-zinc-50 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
        <Icon size={13} className="text-zinc-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-medium mt-0.5 text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>(CATEGORY_LIMITS_DEFAULT);
  const [categorySaved, setCategorySaved] = useState(false);

  // Mileage settings — GET/PUT /api/settings/mileage
  const [mileageRate, setMileageRate] = useState<string>("0.35");
  const [mileageCurrency, setMileageCurrency] = useState<string>("EUR");
  const [mileageUnit, setMileageUnit] = useState<"km" | "miles">("km");
  const [mileageLoading, setMileageLoading] = useState(false);
  const [mileageSaved, setMileageSaved] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    getMileageSettings()
      .then((s) => {
        setMileageRate(String(s.rate));
        setMileageCurrency(s.currency);
        setMileageUnit(s.unit);
      })
      .catch(() => {});
  }, [isAdmin]);

  async function handleSaveMileage(e: React.FormEvent) {
    e.preventDefault();
    const rate = parseFloat(mileageRate);
    if (isNaN(rate) || rate <= 0) return;
    setMileageLoading(true);
    setMileageError(null);
    try {
      const updated = await saveMileageSettings({ rate, currency: mileageCurrency, unit: mileageUnit });
      setMileageRate(String(updated.rate));
      setMileageCurrency(updated.currency);
      setMileageUnit(updated.unit);
      invalidateMileageSettings(updated);
      setMileageSaved(true);
      setTimeout(() => setMileageSaved(false), 2500);
    } catch (err) {
      setMileageError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setMileageLoading(false);
    }
  }

  function handleSaveCategories(e: React.FormEvent) {
    e.preventDefault();
    setCategorySaved(true);
    setTimeout(() => setCategorySaved(false), 2500);
  }

  const inputClass = "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
      <motion.div variants={itemVariants}>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Manage your profile and preferences.</p>
      </motion.div>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-base font-semibold text-white shrink-0">
            {user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "??"}
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-900">
              {user ? `${user.first_name} ${user.last_name}` : "—"}
            </p>
            <p className="text-sm text-zinc-500 capitalize">
              {user?.role ?? "—"}{user?.department ? ` · ${user.department}` : ""}
            </p>
          </div>
        </div>
        <Field icon={User} label="Full name" value={user ? `${user.first_name} ${user.last_name}` : "—"} />
        <Field icon={Mail} label="Email address" value={user?.email ?? "—"} />
        <Field icon={Building2} label="Department" value={user?.department ?? "Not set"} />
        <Field icon={ShieldCheck} label="Role" value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"} />
      </Section>

      {/* Admin — Mileage Rate */}
      {isAdmin && (
        <Section title="Admin — Mileage Reimbursement">
          <form onSubmit={handleSaveMileage} className="p-5 space-y-4">
            <p className="text-xs text-zinc-400">
              Applied automatically to mileage expenses. Distance is computed via OSRM routing between city names.
            </p>

            {/* Rate */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                <Navigation size={11} /> Rate per {mileageUnit} ({mileageCurrency}/{mileageUnit})
              </label>
              <div className="flex items-center gap-2">
                <div className="relative w-36">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    {currencySymbol(mileageCurrency)}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10"
                    value={mileageRate}
                    onChange={(e) => setMileageRate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-7 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white tabular-nums"
                  />
                </div>
                <span className="text-sm text-zinc-400">per {mileageUnit}</span>
              </div>
            </div>

            {/* Currency + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-600">Currency</label>
                <select
                  value={mileageCurrency}
                  onChange={(e) => setMileageCurrency(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white"
                >
                  {["EUR", "USD", "GBP", "CHF", "CAD"].map((c) => (
                    <option key={c} value={c}>{c} ({currencySymbol(c)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-600">Distance unit</label>
                <select
                  value={mileageUnit}
                  onChange={(e) => setMileageUnit(e.target.value as "km" | "miles")}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:bg-white"
                >
                  <option value="km">Kilometres (km)</option>
                  <option value="miles">Miles</option>
                </select>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mileageError && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
                >
                  {mileageError}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={mileageLoading}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {mileageLoading ? "Saving..." : "Save rate"}
              </button>
              <AnimatePresence>
                {mileageSaved && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-emerald-600"
                  >
                    Saved!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Section>
      )}

      {/* Admin — Category Limits */}
      {isAdmin && (
        <Section title="Admin — Category Spend Limits">
          <form onSubmit={handleSaveCategories} className="p-5 space-y-4">
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-xs text-zinc-500">
                <Tag size={11} /> Maximum spend per category ($)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(categoryLimits).map(([cat, limit]) => (
                  <div key={cat}>
                    <label className="mb-1 block text-xs capitalize text-zinc-500">{cat}</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={limit}
                      onChange={(e) => setCategoryLimits((prev) => ({ ...prev, [cat]: Number(e.target.value) }))}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Save limits
              </button>
              <AnimatePresence>
                {categorySaved && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-emerald-600"
                  >
                    Saved!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Section>
      )}
    </motion.div>
  );
}
