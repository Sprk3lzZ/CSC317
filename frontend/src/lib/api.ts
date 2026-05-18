/**
 * ExpenseFlow API layer.
 *
 * Every function tries the real backend first. If the backend is unreachable
 * (network error / connection refused) it falls back to mock data so the UI
 * keeps working during development without the server running.
 *
 * Auth token is read from localStorage key "ef-token".
 */
import type {
  Expense,
  User,
  DashboardStats,
  CategorySpend,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  CreateExpensePayload,
  MileageSettings,
  MileageCalculatePayload,
  MileageCalculateResult,
} from "./types";
import {
  MOCK_EXPENSES,
  MOCK_USERS,
  MOCK_DASHBOARD_STATS,
  MOCK_CATEGORY_SPEND,
} from "./mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "ef-token";

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("ef-user");
}

// ── Core fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let message = `${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/** Returns true if the error looks like a network/connection error. */
function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    (err.message.includes("fetch") ||
      err.message.includes("network") ||
      err.message.includes("Failed"))
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  localStorage.setItem("ef-user", JSON.stringify(data.user));
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  localStorage.setItem("ef-user", JSON.stringify(data.user));
  return data;
}

export async function getMe(): Promise<User> {
  try {
    return await apiFetch<User>("/api/auth/me");
  } catch (err) {
    if (isNetworkError(err)) return Promise.resolve(MOCK_USERS[0]);
    throw err;
  }
}

export function logout(): void {
  clearToken();
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  try {
    return await apiFetch<Expense[]>("/api/expenses");
  } catch (err) {
    if (isNetworkError(err)) return Promise.resolve([...MOCK_EXPENSES]);
    throw err;
  }
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  try {
    return await apiFetch<Expense>(`/api/expenses/${id}`);
  } catch (err) {
    if (isNetworkError(err)) return Promise.resolve(MOCK_EXPENSES.find((e) => e.id === id));
    throw err;
  }
}

export async function createExpense(data: CreateExpensePayload): Promise<Expense> {
  try {
    return await apiFetch<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (err) {
    if (isNetworkError(err)) {
      const newExpense: Expense = {
        id: `EXP-${String(MOCK_EXPENSES.length + 1).padStart(3, "0")}`,
        user_id: "u1",
        title: data.title,
        amount: data.amount,
        currency: data.currency ?? "USD",
        category: data.category,
        expense_date: data.expense_date,
        status: "pending",
        notes: data.notes ?? null,
        receipt_path: data.receipt_path ?? null,
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_EXPENSES.push(newExpense);
      return Promise.resolve(newExpense);
    }
    throw err;
  }
}

export async function approveExpense(id: string): Promise<Expense> {
  try {
    return await apiFetch<Expense>(`/api/expenses/${id}/approve`, { method: "PUT", body: "{}" });
  } catch (err) {
    if (isNetworkError(err)) {
      const expense = MOCK_EXPENSES.find((e) => e.id === id);
      if (!expense) throw new Error(`Expense ${id} not found`);
      expense.status = "approved";
      expense.reviewed_at = new Date().toISOString();
      expense.reviewed_by = "u2";
      return Promise.resolve(expense);
    }
    throw err;
  }
}

export async function rejectExpense(id: string, reason?: string): Promise<Expense> {
  try {
    return await apiFetch<Expense>(`/api/expenses/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ rejection_reason: reason ?? null }),
    });
  } catch (err) {
    if (isNetworkError(err)) {
      const expense = MOCK_EXPENSES.find((e) => e.id === id);
      if (!expense) throw new Error(`Expense ${id} not found`);
      expense.status = "rejected";
      expense.reviewed_at = new Date().toISOString();
      expense.reviewed_by = "u2";
      expense.rejection_reason = reason ?? null;
      return Promise.resolve(expense);
    }
    throw err;
  }
}

// ── Dashboard / Stats ─────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await apiFetch<DashboardStats>("/api/expenses/stats");
  } catch (err) {
    if (isNetworkError(err)) return Promise.resolve(MOCK_DASHBOARD_STATS);
    throw err;
  }
}

export async function getCategorySpend(): Promise<CategorySpend[]> {
  // No dedicated backend endpoint yet — always use mock data derived from expenses
  try {
    const expenses = await getExpenses();
    const map = new Map<string, { amount: number; count: number }>();
    for (const e of expenses) {
      const cur = map.get(e.category) ?? { amount: 0, count: 0 };
      map.set(e.category, { amount: cur.amount + e.amount, count: cur.count + 1 });
    }
    return Array.from(map.entries()).map(([category, v]) => ({ category, ...v }));
  } catch {
    return Promise.resolve(MOCK_CATEGORY_SPEND);
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<User> {
  return getMe();
}

export async function getUsers(): Promise<User[]> {
  try {
    return await apiFetch<User[]>("/api/users");
  } catch (err) {
    if (isNetworkError(err)) return Promise.resolve(MOCK_USERS);
    throw err;
  }
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<{ status: string }> {
  return apiFetch("/api/health");
}

// ── Mileage ───────────────────────────────────────────────────────────────────

export async function getMileageSettings(): Promise<MileageSettings> {
  try {
    return await apiFetch<MileageSettings>("/api/settings/mileage");
  } catch (err) {
    if (isNetworkError(err)) return Promise.resolve({ rate: 0.35, currency: "EUR", unit: "km" });
    throw err;
  }
}

export async function saveMileageSettings(settings: Partial<MileageSettings> & { rate: number }): Promise<MileageSettings> {
  try {
    return await apiFetch<MileageSettings>("/api/settings/mileage", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  } catch (err) {
    if (isNetworkError(err)) return Promise.resolve({ rate: settings.rate, currency: settings.currency ?? "EUR", unit: settings.unit ?? "km" });
    throw err;
  }
}

export async function calculateMileage(payload: MileageCalculatePayload): Promise<MileageCalculateResult> {
  return apiFetch<MileageCalculateResult>("/api/mileage/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
