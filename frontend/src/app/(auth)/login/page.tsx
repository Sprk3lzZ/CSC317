"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { login } from "@/lib/api";

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
      // AuthProvider will redirect to /dashboard once user is set
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

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
            ExpenseFlow
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in to your account
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className="glass rounded-2xl p-6"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Email address
            </label>
            <div
              className="flex items-center gap-2 rounded-lg border px-3 h-10 transition-colors focus-within:border-[color:var(--primary-500)]"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <Mail size={14} style={{ color: "var(--text-muted)" }} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <div
              className="flex items-center gap-2 rounded-lg border px-3 h-10 transition-colors focus-within:border-[color:var(--primary-500)]"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <Lock size={14} style={{ color: "var(--text-muted)" }} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                style={{ color: "var(--text-primary)" }}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary-gradient)" }}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>Sign in <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--primary-400)" }}
        >
          Create one
        </Link>
      </p>
    </motion.div>
  );
}
