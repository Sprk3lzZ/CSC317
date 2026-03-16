"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { register } from "@/lib/api";

const DEPARTMENTS = ["Marketing", "Engineering", "Sales", "HR", "Finance"];

export default function RegisterPage() {
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        department: form.department || undefined,
        role: "employee",
      });
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "flex items-center gap-2 rounded-lg border px-3 h-10 transition-colors focus-within:border-[color:var(--primary-500)]";
  const inputStyle = { background: "var(--bg-elevated)", borderColor: "var(--border)" };
  const fieldStyle = { color: "var(--text-primary)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: "var(--primary-gradient)", boxShadow: "var(--shadow-glow)" }}
        >
          <Wallet size={22} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Create account
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Join your team on ExpenseFlow
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-md)" }}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                First name
              </label>
              <div className={inputClass} style={inputStyle}>
                <User size={14} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  required
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={update("first_name")}
                  placeholder="Jane"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                  style={fieldStyle}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Last name
              </label>
              <div className={inputClass} style={inputStyle}>
                <User size={14} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  required
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={update("last_name")}
                  placeholder="Smith"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                  style={fieldStyle}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Email address
            </label>
            <div className={inputClass} style={inputStyle}>
              <Mail size={14} style={{ color: "var(--text-muted)" }} />
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@company.com"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Department
            </label>
            <div className={inputClass} style={inputStyle}>
              <Building2 size={14} style={{ color: "var(--text-muted)" }} />
              <select
                value={form.department}
                onChange={update("department")}
                className="flex-1 bg-transparent text-sm outline-none"
                style={fieldStyle}
              >
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <div className={inputClass} style={inputStyle}>
              <Lock size={14} style={{ color: "var(--text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={update("password")}
                placeholder="Min 8 characters"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                style={fieldStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Confirm password
            </label>
            <div className={inputClass} style={inputStyle}>
              <Lock size={14} style={{ color: "var(--text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={update("confirm_password")}
                placeholder="Re-enter password"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg px-3 py-2 text-xs"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "var(--status-rejected)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
            style={{ background: "var(--primary-gradient)" }}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>Create account <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--primary-400)" }}
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
