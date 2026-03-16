"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Building2, ShieldCheck, Sun, Moon, DollarSign, Tag } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";

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
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const } },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section variants={itemVariants}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {title}
      </h2>
      <div className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
        {children}
      </div>
    </motion.section>
  );
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-overlay)" }}>
        <Icon size={14} style={{ color: "var(--text-muted)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [mileageRate, setMileageRate] = useState("0.67");
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>(CATEGORY_LIMITS_DEFAULT);
  const [saved, setSaved] = useState(false);

  const isAdmin = user?.role === "admin";

  function handleSaveAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your profile and preferences.
        </p>
      </motion.div>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-4 mb-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shrink-0"
            style={{ background: "var(--primary-gradient)" }}
          >
            {user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "??"}
          </div>
          <div>
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {user ? `${user.first_name} ${user.last_name}` : "—"}
            </p>
            <p className="text-sm capitalize" style={{ color: "var(--text-secondary)" }}>
              {user?.role ?? "—"}{user?.department ? ` · ${user.department}` : ""}
            </p>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <Field icon={User} label="Full name" value={user ? `${user.first_name} ${user.last_name}` : "—"} />
          <Field icon={Mail} label="Email address" value={user?.email ?? "—"} />
          <Field icon={Building2} label="Department" value={user?.department ?? "Not set"} />
          <Field icon={ShieldCheck} label="Role" value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"} />
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--bg-overlay)" }}>
              {theme === "dark" ? <Moon size={14} style={{ color: "var(--text-muted)" }} /> : <Sun size={14} style={{ color: "var(--text-muted)" }} />}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Theme</p>
              <p className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{theme} mode</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className="relative h-6 w-11 rounded-full transition-colors"
            style={{ background: theme === "dark" ? "var(--primary-500)" : "var(--bg-overlay)" }}
            aria-label="Toggle theme"
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: theme === "dark" ? "translateX(20px)" : "translateX(2px)" }}
            />
          </button>
        </div>
      </Section>

      {/* Admin section */}
      {isAdmin && (
        <Section title="Admin — Policy Settings">
          <form onSubmit={handleSaveAdmin} className="space-y-5">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <DollarSign size={12} /> Mileage reimbursement rate ($/mile)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={mileageRate}
                onChange={(e) => setMileageRate(e.target.value)}
                className="w-48 rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <Tag size={12} /> Category spend limits ($)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(categoryLimits).map(([cat, limit]) => (
                  <div key={cat}>
                    <label className="mb-1 block text-xs capitalize" style={{ color: "var(--text-muted)" }}>{cat}</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={limit}
                      onChange={(e) => setCategoryLimits((prev) => ({ ...prev, [cat]: Number(e.target.value) }))}
                      className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--primary-gradient)" }}
              >
                Save settings
              </button>
              {saved && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm"
                  style={{ color: "var(--status-approved)" }}
                >
                  Saved!
                </motion.span>
              )}
            </div>
          </form>
        </Section>
      )}
    </motion.div>
  );
}
