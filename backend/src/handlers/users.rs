use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};

use crate::{
    auth::{AdminUser, AuthUser, ManagerOrAdmin},
    models::{expense::Expense, user::UserPublic},
    AppState,
};

pub async fn list_users(
    AdminUser(_claims): AdminUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<UserPublic>>, (StatusCode, Json<Value>)> {
    let users = sqlx::query_as::<_, crate::models::user::User>("SELECT * FROM users ORDER BY last_name, first_name")
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    Ok(Json(users.into_iter().map(UserPublic::from).collect()))
}

pub async fn get_user(
    AuthUser(claims): AuthUser,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<UserPublic>, (StatusCode, Json<Value>)> {
    // Employees can only view themselves
    if claims.role == "employee" && claims.sub != id {
        return Err((StatusCode::FORBIDDEN, Json(json!({"error": "Access denied"}))));
    }

    let user = sqlx::query_as::<_, crate::models::user::User>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({"error": "User not found"}))))?;

    Ok(Json(user.into()))
}

pub async fn get_user_expenses(
    ManagerOrAdmin(_claims): ManagerOrAdmin,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<Expense>>, (StatusCode, Json<Value>)> {
    let expenses = sqlx::query_as::<_, Expense>(
        "SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(&id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    Ok(Json(expenses))
}
