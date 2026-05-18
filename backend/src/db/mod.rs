use sqlx::{SqlitePool, sqlite::{SqliteConnectOptions, SqlitePoolOptions}};
use std::str::FromStr;

pub async fn create_pool(database_url: &str) -> Result<SqlitePool, sqlx::Error> {
    let opts = SqliteConnectOptions::from_str(database_url)?
        .create_if_missing(true);

    SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(include_str!("../../migrations/001_initial.sql"))
        .execute(pool)
        .await?;

    // Run each statement separately; ignore "duplicate column" errors
    // because SQLite has no ADD COLUMN IF NOT EXISTS.
    for migration in &[
        include_str!("../../migrations/002_mileage.sql"),
        include_str!("../../migrations/003_mileage_unit.sql"),
    ] {
        for stmt in migration.split(';') {
            let stmt = stmt.trim();
            if stmt.is_empty() {
                continue;
            }
            if let Err(e) = sqlx::query(stmt).execute(pool).await {
                let msg = e.to_string();
                if !msg.contains("duplicate column name") && !msg.contains("UNIQUE constraint failed") {
                    return Err(e);
                }
            }
        }
    }

    Ok(())
}

pub async fn seed_users(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let password_hash = bcrypt::hash("password123", bcrypt::DEFAULT_COST)
        .expect("Failed to hash password");

    let yanis_hash = bcrypt::hash("yanisyanis", bcrypt::DEFAULT_COST)
        .expect("Failed to hash password");

    let users: Vec<(&str, &str, &str, &str, &str, &str, &str)> = vec![
        ("user-marie", "marie.dupont@expenseflow.com", &password_hash, "Marie", "Dupont", "employee", "Marketing"),
        ("user-thomas", "thomas.bernard@expenseflow.com", &password_hash, "Thomas", "Bernard", "employee", "Engineering"),
        ("user-lea", "lea.petit@expenseflow.com", &password_hash, "Léa", "Petit", "employee", "Sales"),
        ("user-jean", "jean.martin@expenseflow.com", &password_hash, "Jean", "Martin", "manager", "Engineering"),
        ("user-admin", "admin@expenseflow.com", &password_hash, "Admin", "HR", "admin", "Human Resources"),
        ("user-yanis", "yanis@renofid.com", &yanis_hash, "Yanis", "Zeghiche", "manager", "Renofid"),
    ];

    for (id, email, hash, first_name, last_name, role, department) in &users {
        sqlx::query(
            "INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(id)
        .bind(email)
        .bind(hash)
        .bind(first_name)
        .bind(last_name)
        .bind(role)
        .bind(department)
        .execute(pool)
        .await?;
    }

    seed_expenses(pool).await?;

    Ok(())
}

async fn seed_expenses(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let expenses: Vec<(&str, &str, &str, f64, &str, &str, &str, &str, &str, Option<&str>)> = vec![
        // Original fixtures
        ("exp-001", "user-marie", "Flight to Paris Conference", 450.00, "EUR", "Travel", "2026-03-01", "approved", "user-jean", Some("2026-03-02")),
        ("exp-002", "user-marie", "Hotel - 2 nights Paris", 280.00, "EUR", "Travel", "2026-03-01", "approved", "user-jean", Some("2026-03-02")),
        ("exp-003", "user-thomas", "Team lunch", 85.50, "EUR", "Meals & Entertainment", "2026-03-05", "pending", "", None),
        ("exp-004", "user-thomas", "GitHub Copilot subscription", 19.00, "EUR", "Software & Tools", "2026-03-01", "approved", "user-jean", Some("2026-03-03")),
        ("exp-005", "user-lea", "Client dinner", 120.00, "EUR", "Meals & Entertainment", "2026-03-07", "pending", "", None),
        ("exp-006", "user-lea", "Sales training workshop", 350.00, "EUR", "Training & Education", "2026-03-10", "rejected", "user-jean", Some("2026-03-11")),
        ("exp-007", "user-marie", "Office supplies", 45.00, "EUR", "Office Supplies", "2026-03-12", "pending", "", None),
        // New demo fixtures
        ("exp-100", "user-yanis", "Client lunch — Renofid kickoff", 97.50, "EUR", "Meals & Entertainment", "2026-02-10", "approved", "user-admin", Some("2026-02-11")),
        ("exp-101", "user-yanis", "Uber to airport", 34.00, "EUR", "Travel", "2026-02-14", "approved", "user-admin", Some("2026-02-15")),
        ("exp-102", "user-yanis", "AWS subscription — February", 210.00, "EUR", "Software & Tools", "2026-02-28", "approved", "user-admin", Some("2026-03-01")),
        ("exp-103", "user-yanis", "Notion team plan", 48.00, "EUR", "Software & Tools", "2026-03-01", "approved", "user-admin", Some("2026-03-02")),
        ("exp-104", "user-yanis", "Conference ticket — Web Summit", 899.00, "EUR", "Training & Education", "2026-03-15", "pending", "", None),
        ("exp-105", "user-yanis", "Mileage Paris → Lille", 62.40, "EUR", "Travel", "2026-03-20", "approved", "user-admin", Some("2026-03-21")),
        ("exp-106", "user-yanis", "Hotel Lyon — 2 nights", 320.00, "EUR", "Travel", "2026-04-03", "rejected", "user-admin", Some("2026-04-04")),
        ("exp-107", "user-marie", "Figma subscription", 45.00, "EUR", "Software & Tools", "2026-04-01", "approved", "user-admin", Some("2026-04-02")),
        ("exp-108", "user-marie", "Team offsite dinner", 230.00, "EUR", "Meals & Entertainment", "2026-04-08", "approved", "user-admin", Some("2026-04-09")),
        ("exp-109", "user-thomas", "SaaS security audit tool", 175.00, "EUR", "Software & Tools", "2026-04-10", "pending", "", None),
        ("exp-110", "user-thomas", "Mileage Paris → Bordeaux", 88.20, "EUR", "Travel", "2026-04-15", "approved", "user-jean", Some("2026-04-16")),
        ("exp-111", "user-lea", "Client gift — contract signed", 150.00, "EUR", "Meals & Entertainment", "2026-04-20", "approved", "user-admin", Some("2026-04-21")),
        ("exp-112", "user-lea", "Train Lyon — Paris", 67.00, "EUR", "Travel", "2026-04-22", "rejected", "user-admin", Some("2026-04-23")),
        ("exp-113", "user-yanis", "Slack annual plan", 96.00, "EUR", "Software & Tools", "2026-05-01", "approved", "user-admin", Some("2026-05-02")),
        ("exp-114", "user-yanis", "Strategy lunch — Renofid Q2", 112.00, "EUR", "Meals & Entertainment", "2026-05-05", "pending", "", None),
        ("exp-115", "user-marie", "Design conference — Figma Config", 549.00, "EUR", "Training & Education", "2026-05-10", "pending", "", None),
        ("exp-116", "user-thomas", "Hardware — USB-C hub", 58.00, "EUR", "Office Supplies", "2026-05-12", "approved", "user-jean", Some("2026-05-13")),
    ];

    for (id, user_id, title, amount, currency, category, expense_date, status, reviewed_by, reviewed_at) in expenses {
        let rev_by: Option<&str> = if reviewed_by.is_empty() { None } else { Some(reviewed_by) };
        sqlx::query(
            "INSERT OR IGNORE INTO expenses (id, user_id, title, amount, currency, category, expense_date, status, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(id)
        .bind(user_id)
        .bind(title)
        .bind(amount)
        .bind(currency)
        .bind(category)
        .bind(expense_date)
        .bind(status)
        .bind(rev_by)
        .bind(reviewed_at)
        .execute(pool)
        .await?;
    }

    Ok(())
}
