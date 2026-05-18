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

  const fieldWrap = "flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 h-10 transition-colors focus-within:border-zinc-400 focus-within:bg-white";
  const inputClass = "flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
          <Wallet size={18} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Create account</h1>
          <p className="mt-1 text-sm text-zinc-500">Join your team on ExpenseFlow</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">First name</label>
              <div className={fieldWrap}>
                <User size={13} className="text-zinc-400 shrink-0" />
                <input type="text" required autoComplete="given-name" value={form.first_name} onChange={update("first_name")} placeholder="Jane" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">Last name</label>
              <div className={fieldWrap}>
                <User size={13} className="text-zinc-400 shrink-0" />
                <input type="text" required autoComplete="family-name" value={form.last_name} onChange={update("last_name")} placeholder="Smith" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Email address</label>
            <div className={fieldWrap}>
              <Mail size={13} className="text-zinc-400 shrink-0" />
              <input type="email" required autoComplete="email" value={form.email} onChange={update("email")} placeholder="you@company.com" className={inputClass} />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Department</label>
            <div className={fieldWrap}>
              <Building2 size={13} className="text-zinc-400 shrink-0" />
              <select value={form.department} onChange={update("department")} className={`${inputClass} cursor-pointer`}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Password</label>
            <div className={fieldWrap}>
              <Lock size={13} className="text-zinc-400 shrink-0" />
              <input type={showPassword ? "text" : "password"} required autoComplete="new-password" value={form.password} onChange={update("password")} placeholder="Min 8 characters" className={inputClass} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Confirm password</label>
            <div className={fieldWrap}>
              <Lock size={13} className="text-zinc-400 shrink-0" />
              <input type={showPassword ? "text" : "password"} required autoComplete="new-password" value={form.confirm_password} onChange={update("confirm_password")} placeholder="Re-enter password" className={inputClass} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>Create account <ArrowRight size={14} /></>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 hover:underline transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
