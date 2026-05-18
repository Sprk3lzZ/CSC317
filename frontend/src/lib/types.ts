// ── Expense ───────────────────────────────────────────────────────────────────

export type ExpenseStatus =
  | "pending"
  | "approved"
  | "rejected";

export type ExpenseCategory =
  | "travel"
  | "meals"
  | "software"
  | "hardware"
  | "office"
  | "training"
  | "other";

/** Shape returned by the backend */
export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  expense_date: string;
  status: string;
  receipt_path: string | null;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpensePayload {
  title: string;
  amount: number;
  currency?: string;
  category: string;
  expense_date: string;
  receipt_path?: string | null;
  notes?: string | null;
  // mileage extras — passed through from /api/mileage/calculate
  departure_city?: string | null;
  arrival_city?: string | null;
  distance?: number | null;
  distance_unit?: "km" | "miles" | null;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "employee" | "manager" | "admin";
  department: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  department?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_count: number;
  total_amount: number;
  pending_count: number;
  pending_amount: number;
  approved_count: number;
  approved_amount: number;
}

// ── Legacy types kept for mock-data compatibility ─────────────────────────────

export interface CategorySpend {
  category: string;
  amount: number;
  count: number;
}

// ── Mileage ───────────────────────────────────────────────────────────────────

/** GET/PUT /api/settings/mileage */
export interface MileageSettings {
  rate: number;
  currency: string;
  unit: "km" | "miles";
}

/** POST /api/mileage/calculate body */
export interface MileageCalculatePayload {
  from: string;
  to: string;
}

/** POST /api/mileage/calculate response */
export interface MileageCalculateResult {
  distance: number;
  unit: "km" | "miles";
  rate: number;
  currency: string;
  amount: number;
  from_resolved: string;
  to_resolved: string;
}
