use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    auth::{AuthUser, ManagerOrAdmin},
    models::expense::{
        CreateExpenseRequest, Expense, ExpenseFilters, ReviewExpenseRequest, UpdateExpenseRequest,
    },
    AppState,
};

pub async fn list_expenses(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Query(filters): Query<ExpenseFilters>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    // Employees only see their own expenses; managers/admins can filter by user_id or see all
    let is_privileged = claims.role == "manager" || claims.role == "admin";

    let user_id_filter = if is_privileged {
        filters.user_id.clone()
    } else {
        Some(claims.sub.clone())
    };

    let mut query = String::from("SELECT * FROM expenses WHERE 1=1");
    let mut args: Vec<String> = Vec::new();

    if let Some(uid) = &user_id_filter {
        query.push_str(" AND user_id = ?");
        args.push(uid.clone());
    }
    if let Some(status) = &filters.status {
        query.push_str(" AND status = ?");
        args.push(status.clone());
    }
    if let Some(category) = &filters.category {
        query.push_str(" AND category = ?");
        args.push(category.clone());
    }
    if let Some(from) = &filters.from_date {
        query.push_str(" AND expense_date >= ?");
        args.push(from.clone());
    }
    if let Some(to) = &filters.to_date {
        query.push_str(" AND expense_date <= ?");
        args.push(to.clone());
    }

    query.push_str(" ORDER BY created_at DESC");

    let mut q = sqlx::query_as::<_, Expense>(&query);
    for arg in &args {
        q = q.bind(arg);
    }

    let expenses = q.fetch_all(&state.db).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        )
    })?;

    Ok(Json(json!(expenses)))
}

pub async fn get_expense(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Expense>, (StatusCode, Json<Value>)> {
    let expense = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": e.to_string()})),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Expense not found"})),
            )
        })?;

    // Employees can only view their own expenses
    if claims.role == "employee" && expense.user_id != claims.sub {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "Access denied"})),
        ));
    }

    Ok(Json(expense))
}

pub async fn create_expense(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Json(req): Json<CreateExpenseRequest>,
) -> Result<(StatusCode, Json<Expense>), (StatusCode, Json<Value>)> {
    let id = Uuid::new_v4().to_string();
    let currency = req.currency.unwrap_or_else(|| "EUR".to_string());
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO expenses (id, user_id, title, amount, currency, category, expense_date, status, receipt_path, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&claims.sub)
    .bind(&req.title)
    .bind(req.amount)
    .bind(&currency)
    .bind(&req.category)
    .bind(&req.expense_date)
    .bind(&req.receipt_path)
    .bind(&req.notes)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        )
    })?;

    let expense = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": e.to_string()})),
            )
        })?;

    Ok((StatusCode::CREATED, Json(expense)))
}

pub async fn update_expense(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<UpdateExpenseRequest>,
) -> Result<Json<Expense>, (StatusCode, Json<Value>)> {
    let expense = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": e.to_string()})),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Expense not found"})),
            )
        })?;

    if expense.user_id != claims.sub && claims.role == "employee" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "Access denied"})),
        ));
    }

    // Only pending expenses can be edited
    if expense.status != "pending" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Only pending expenses can be edited"})),
        ));
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "UPDATE expenses SET
            title = COALESCE(?, title),
            amount = COALESCE(?, amount),
            currency = COALESCE(?, currency),
            category = COALESCE(?, category),
            expense_date = COALESCE(?, expense_date),
            receipt_path = COALESCE(?, receipt_path),
            notes = COALESCE(?, notes),
            updated_at = ?
         WHERE id = ?",
    )
    .bind(&req.title)
    .bind(req.amount)
    .bind(&req.currency)
    .bind(&req.category)
    .bind(&req.expense_date)
    .bind(&req.receipt_path)
    .bind(&req.notes)
    .bind(&now)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        )
    })?;

    let updated = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": e.to_string()})),
            )
        })?;

    Ok(Json(updated))
}

pub async fn delete_expense(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let expense = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": e.to_string()})),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Expense not found"})),
            )
        })?;

    if expense.user_id != claims.sub && claims.role == "employee" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "Access denied"})),
        ));
    }

    if expense.status != "pending" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Only pending expenses can be deleted"})),
        ));
    }

    sqlx::query("DELETE FROM expenses WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": e.to_string()})),
            )
        })?;

    Ok(Json(json!({"message": "Expense deleted"})))
}

pub async fn approve_expense(
    ManagerOrAdmin(claims): ManagerOrAdmin,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Expense>, (StatusCode, Json<Value>)> {
    let expense = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({"error": "Expense not found"}))))?;

    if expense.status != "pending" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Only pending expenses can be approved"})),
        ));
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "UPDATE expenses SET status = 'approved', reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(&claims.sub)
    .bind(&now)
    .bind(&now)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    let updated = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    Ok(Json(updated))
}

pub async fn reject_expense(
    ManagerOrAdmin(claims): ManagerOrAdmin,
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<ReviewExpenseRequest>,
) -> Result<Json<Expense>, (StatusCode, Json<Value>)> {
    let expense = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({"error": "Expense not found"}))))?;

    if expense.status != "pending" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Only pending expenses can be rejected"})),
        ));
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "UPDATE expenses SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, rejection_reason = ?, updated_at = ? WHERE id = ?",
    )
    .bind(&claims.sub)
    .bind(&now)
    .bind(&req.rejection_reason)
    .bind(&now)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    let updated = sqlx::query_as::<_, Expense>("SELECT * FROM expenses WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    Ok(Json(updated))
}

pub async fn get_stats(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let is_privileged = claims.role == "manager" || claims.role == "admin";

    let (total, pending, approved) = if is_privileged {
        let total: (i64, f64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(amount), 0.0) FROM expenses",
        )
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

        let pending: (i64, f64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(amount), 0.0) FROM expenses WHERE status = 'pending'",
        )
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

        let approved: (i64, f64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(amount), 0.0) FROM expenses WHERE status = 'approved'",
        )
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

        (total, pending, approved)
    } else {
        let uid = &claims.sub;

        let total: (i64, f64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(amount), 0.0) FROM expenses WHERE user_id = ?",
        )
        .bind(uid)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

        let pending: (i64, f64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(amount), 0.0) FROM expenses WHERE status = 'pending' AND user_id = ?",
        )
        .bind(uid)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

        let approved: (i64, f64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(amount), 0.0) FROM expenses WHERE status = 'approved' AND user_id = ?",
        )
        .bind(uid)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

        (total, pending, approved)
    };

    // Expenses by category
    let by_category: Vec<(String, f64)> = if is_privileged {
        sqlx::query_as(
            "SELECT category, COALESCE(SUM(amount), 0.0) FROM expenses GROUP BY category ORDER BY SUM(amount) DESC",
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?
    } else {
        sqlx::query_as(
            "SELECT category, COALESCE(SUM(amount), 0.0) FROM expenses WHERE user_id = ? GROUP BY category ORDER BY SUM(amount) DESC",
        )
        .bind(&claims.sub)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?
    };

    // Recent expenses (last 5)
    let recent_expenses: Vec<Expense> = if is_privileged {
        sqlx::query_as(
            "SELECT * FROM expenses ORDER BY created_at DESC LIMIT 5",
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?
    } else {
        sqlx::query_as(
            "SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
        )
        .bind(&claims.sub)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?
    };

    let expenses_by_category: Vec<serde_json::Value> = by_category
        .into_iter()
        .map(|(cat, amt)| json!({"category": cat, "amount": amt}))
        .collect();

    Ok(Json(json!({
        "total_expenses": total.0,
        "total_amount": total.1,
        "pending_count": pending.0,
        "pending_amount": pending.1,
        "approved_count": approved.0,
        "approved_amount": approved.1,
        "expenses_by_category": expenses_by_category,
        "recent_expenses": recent_expenses,
    })))
}
