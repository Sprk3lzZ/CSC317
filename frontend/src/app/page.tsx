"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HealthResponse {
  status: string;
  message: string;
}

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data: HealthResponse) => setBackendStatus(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-zinc-950">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Expense Management System
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          CSC 317 Project – Frontend & Backend Test
        </p>

        <div className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Backend Connection Test
          </h2>
          {backendStatus ? (
            <div className="space-y-2 text-left">
              <p>
                <span className="font-medium text-green-600 dark:text-green-400">
                  ✓ Connected
                </span>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Status: <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{backendStatus.status}</code>
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Message: {backendStatus.message}
              </p>
            </div>
          ) : error ? (
            <p className="text-left text-red-600 dark:text-red-400">
              ✗ Error: {error}
            </p>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              Loading...
            </p>
          )}
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Frontend: Next.js · Backend: Rust (Axum)
        </p>
      </main>
    </div>
  );
}
