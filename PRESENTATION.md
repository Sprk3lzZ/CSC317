# ExpenseFlow

**A modern expense management system for employees, managers, and HR.**

CSC 317 — Final project presentation.

---

## 1. What it does

ExpenseFlow turns the messy, paper-based expense reimbursement process into a clean, role-aware web app.

- **Employees** submit expenses (travel, meals, mileage, software, training, supplies…) with title, amount, category, date, and optional notes.
- **Managers** review their team's submissions, approve or reject with a reason.
- **HR / Admin** has a company-wide view, manages users, sets business rules (mileage rate, currency, distance unit), and oversees reimbursements.

The goal: less time on paperwork, fewer mistakes, full transparency on who spent what and where.

---

## 2. Key features

- **Role-based dashboards** — the same dashboard adapts to employee, manager, or admin perspective.
- **Smart spend analytics** — animated stat cards, "spend by category" bar chart, recent activity feed.
- **One-click approvals** — managers approve or reject directly from the inbox.
- **Configurable mileage calculator** — set rate, currency, and unit (km / mi), then auto-calculate trip reimbursements.
- **Demo-friendly auth** — JWT-based login, in-app demo credential shortcuts for fast walkthroughs.
- **Resilient frontend** — if the backend is unreachable, the UI falls back to mock data so demos never break.

---

## 3. Tech stack

### Frontend
| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, React 19) |
| Language | TypeScript |
| Styling | **Tailwind CSS v4** + CSS variables (zinc-minimal design tokens) |
| Animations | **Framer Motion** (page transitions, count-ups, layout animations) |
| Charts | **Recharts** |
| Icons | **lucide-react** |
| State / Auth | Local JWT in `localStorage`, lightweight `AuthProvider` context |

### Backend
| Layer | Choice |
|---|---|
| Language | **Rust** (edition 2021) |
| Web framework | **Axum 0.7** with `tower-http` |
| Async runtime | **Tokio** |
| Database driver | **SQLx 0.8** (compile-time-checked queries) |
| Database | **SQLite** (single-file, zero-ops for the demo) |
| Auth | **JWT** (`jsonwebtoken`) + **bcrypt** password hashing |
| Logging | `tracing` + `tracing-subscriber` |
| HTTP client | `reqwest` (used for the mileage calculator) |

### Infrastructure
- **Docker Compose** orchestrates both services.
- Persistent SQLite volume (`backend-data`) so demo data survives restarts.
- Frontend on `:3080`, backend on `:8000`.

---

## 4. Architecture

```
┌─────────────────┐        HTTPS / JSON        ┌──────────────────┐
│   Next.js 16    │ ────────────────────────▶  │   Axum (Rust)    │
│  React 19 + TS  │ ◀────────────────────────  │   JWT-protected  │
│   Tailwind v4   │                            │   handlers       │
└─────────────────┘                            └────────┬─────────┘
                                                        │ SQLx
                                                        ▼
                                                ┌──────────────────┐
                                                │     SQLite       │
                                                │  expenseflow.db  │
                                                └──────────────────┘
```

**Backend layout** (`backend/src/`):
- `main.rs` — router, CORS, startup
- `db/` — pool, migrations, demo seed
- `models/` — `expense`, `user`, `settings` structs
- `handlers/` — `auth`, `expenses`, `mileage`, `settings`, `users`
- `auth/` — JWT middleware

**Frontend layout** (`frontend/src/`):
- `app/(auth)/` — login & register (public)
- `app/(app)/` — dashboard, expenses, approvals, settings (authenticated)
- `components/layout/` — `AppShell`, `Sidebar`, `Topbar`
- `components/ui/` — `StatCard`, `StatusBadge`, `Skeleton`, `GradientMesh`
- `lib/api.ts` — typed API client with mock-data fallback

---

## 5. Data model

```
User ─┬─< Expense >──┐
      │              │
      └─reviews─────┘
```

| Table | Purpose |
|---|---|
| `users` | id, email, password_hash, first_name, last_name, role (`employee` / `manager` / `admin`), department |
| `expenses` | id, user_id, title, amount, currency, category, expense_date, status (`pending` / `approved` / `rejected`), reviewed_by, reviewed_at, rejection_reason, notes, receipt_path |
| `categories` | predefined catalog (Travel, Meals, Office Supplies, Software, Training, Other) |
| `mileage_settings` | rate, currency, unit (km / mi) |

---

## 6. API surface (selected)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/auth/login` | JWT login |
| `POST` | `/api/auth/register` | Create employee account |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/expenses` | List (scoped to role) |
| `POST` | `/api/expenses` | Submit a new expense |
| `PUT` | `/api/expenses/:id/approve` | Manager / admin approval |
| `PUT` | `/api/expenses/:id/reject` | Reject with reason |
| `GET` | `/api/expenses/stats` | Dashboard aggregates |
| `POST` | `/api/mileage/calculate` | Compute mileage reimbursement |
| `GET` / `PUT` | `/api/settings/mileage` | Read / update mileage business rules |
| `GET` | `/api/users` | Directory (admin) |

All responses use `serde(rename_all = "camelCase")`-style JSON consumed by typed TypeScript interfaces in `frontend/src/lib/types.ts`.

---

## 7. Demo credentials

The backend seeds demo data on every startup (idempotent — safe to re-run).

| Account | Role | Email | Password |
|---|---|---|---|
| **Yanis** | Manager (Renofid) | `yanis@renofid.com` | `yanisyanis` |
| **Admin / HR** | Admin | `admin@expenseflow.com` | `password123` |
| Marie Dupont | Employee (Marketing) | `marie.dupont@expenseflow.com` | `password123` |
| Thomas Bernard | Employee (Engineering) | `thomas.bernard@expenseflow.com` | `password123` |
| Léa Petit | Employee (Sales) | `lea.petit@expenseflow.com` | `password123` |
| Jean Martin | Manager (Engineering) | `jean.martin@expenseflow.com` | `password123` |

The login screen exposes one-click shortcuts for the **Yanis** and **Admin** accounts to speed up the walkthrough.

---

## 8. Running it

### With Docker Compose (recommended)

```bash
docker compose up -d
```

- Frontend → http://localhost:3080
- Backend → http://localhost:8000/api/health

### Without Docker

```bash
# Backend
cd backend && cargo run --release

# Frontend
cd frontend && npm install && npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` when running the frontend standalone.

---

## 9. Design system

- **Palette** — pure white / zinc grays / black. No bright accents. Reads as serious, professional, finance-grade.
- **Typography** — Geist Sans, tight tracking on headings, tabular numerics for amounts.
- **Motion** — Framer Motion for staggered card entries, animated count-ups, layout transitions, and skeleton shimmers. All motion is short (200–400 ms) and tasteful.
- **Accessibility** — focus rings, semantic HTML, color-blind-safe status badges.

---

## 10. What's next

- Receipt OCR (parse PDFs / photos to pre-fill the form)
- Multi-currency conversion with live FX
- Email notifications on status change
- Audit log per expense
- CSV / PDF report export for accounting
- Postgres swap for production deployment

---

*Built with Next.js, React 19, Rust, Axum, SQLite, Tailwind CSS, and Framer Motion.*
