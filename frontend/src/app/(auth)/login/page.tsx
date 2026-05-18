"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { login } from "@/lib/api";

const DEMO_CREDENTIALS = [
  { label: "Manager", email: "yanis@renofid.com", password: "yanisyanis" },
  { label: "Admin", email: "admin@expenseflow.com", password: "password123" },
];

export default function LoginPage() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login({ email, password });
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">ExpenseFlow</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-600">
              Email address
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 h-10 transition-colors focus-within:border-zinc-400 focus-within:bg-white">
              <Mail size={13} className="text-zinc-400 shrink-0" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-600">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 h-10 transition-colors focus-within:border-zinc-400 focus-within:bg-white">
              <Lock size={13} className="text-zinc-400 shrink-0" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>Sign in <ArrowRight size={14} /></>
            )}
          </button>
        </form>
      </div>

      {/* Demo credentials */}
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white/70 px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Demo credentials</p>
        <div className="flex flex-col gap-1.5">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.email}
              type="button"
              onClick={() => { setEmail(cred.email); setPassword(cred.password); }}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-zinc-50 group"
            >
              <div>
                <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-700">{cred.label}</span>
                <span className="ml-2 font-mono text-[11px] text-zinc-400">{cred.email}</span>
              </div>
              <span className="text-[10px] text-zinc-300 group-hover:text-zinc-400 transition-colors">click to fill</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-zinc-900 hover:underline transition-colors">
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
