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
    Ok(())
}

pub async fn seed_users(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Check if users already seeded
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;

    if count.0 > 0 {
        return Ok(());
    }

    let password_hash = bcrypt::hash("password123", bcrypt::DEFAULT_COST)
        .expect("Failed to hash password");

    let users = vec![
        ("user-marie", "marie.dupont@expenseflow.com", "Marie", "Dupont", "employee", "Marketing"),
        ("user-thomas", "thomas.bernard@expenseflow.com", "Thomas", "Bernard", "employee", "Engineering"),
        ("user-lea", "lea.petit@expenseflow.com", "Léa", "Petit", "employee", "Sales"),
        ("user-jean", "jean.martin@expenseflow.com", "Jean", "Martin", "manager", "Engineering"),
        ("user-admin", "admin@expenseflow.com", "Admin", "HR", "admin", "Human Resources"),
    ];

    for (id, email, first_name, last_name, role, department) in users {
        sqlx::query(
            "INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(id)
        .bind(email)
        .bind(&password_hash)
        .bind(first_name)
        .bind(last_name)
        .bind(role)
        .bind(department)
        .execute(pool)
        .await?;
    }

    // Seed some sample expenses
    seed_expenses(pool).await?;

    Ok(())
}

async fn seed_expenses(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let expenses = vec![
        ("exp-001", "user-marie", "Flight to Paris Conference", 450.00, "EUR", "Travel", "2026-03-01", "approved", "user-jean", Some("2026-03-02")),
        ("exp-002", "user-marie", "Hotel - 2 nights Paris", 280.00, "EUR", "Travel", "2026-03-01", "approved", "user-jean", Some("2026-03-02")),
        ("exp-003", "user-thomas", "Team lunch", 85.50, "EUR", "Meals & Entertainment", "2026-03-05", "pending", "", None),
        ("exp-004", "user-thomas", "GitHub Copilot subscription", 19.00, "EUR", "Software & Tools", "2026-03-01", "approved", "user-jean", Some("2026-03-03")),
        ("exp-005", "user-lea", "Client dinner", 120.00, "EUR", "Meals & Entertainment", "2026-03-07", "pending", "", None),
        ("exp-006", "user-lea", "Sales training workshop", 350.00, "EUR", "Training & Education", "2026-03-10", "rejected", "user-jean", Some("2026-03-11")),
        ("exp-007", "user-marie", "Office supplies", 45.00, "EUR", "Office Supplies", "2026-03-12", "pending", "", None),
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
