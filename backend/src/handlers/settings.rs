use axum::{extract::State, http::StatusCode, Json};
use serde_json::{json, Value};

use crate::{
    auth::AdminUser,
    models::settings::{MileageSettings, UpdateMileageRequest},
    AppState,
};

async fn fetch_mileage_settings(
    db: &sqlx::SqlitePool,
) -> Result<MileageSettings, (StatusCode, Json<Value>)> {
    let rows: Vec<(String, String)> =
        sqlx::query_as("SELECT key, value FROM settings WHERE key IN ('mileage_rate', 'mileage_currency', 'mileage_unit')")
            .fetch_all(db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    let mut rate = 0.35f64;
    let mut currency = "EUR".to_string();
    let mut unit = "km".to_string();

    for (key, value) in rows {
        match key.as_str() {
            "mileage_rate" => rate = value.parse().unwrap_or(0.35),
            "mileage_currency" => currency = value,
            "mileage_unit" => unit = value,
            _ => {}
        }
    }

    Ok(MileageSettings { rate, currency, unit })
}

pub async fn get_mileage_settings(
    State(state): State<AppState>,
) -> Result<Json<MileageSettings>, (StatusCode, Json<Value>)> {
    let settings = fetch_mileage_settings(&state.db).await?;
    Ok(Json(settings))
}

pub async fn update_mileage_settings(
    AdminUser(_claims): AdminUser,
    State(state): State<AppState>,
    Json(req): Json<UpdateMileageRequest>,
) -> Result<Json<MileageSettings>, (StatusCode, Json<Value>)> {
    if req.rate <= 0.0 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "rate must be greater than 0"})),
        ));
    }

    if let Some(ref unit) = req.unit {
        if unit != "km" && unit != "miles" {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "unit must be 'km' or 'miles'"})),
            ));
        }
    }

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    sqlx::query(
        "INSERT INTO settings (key, value, description, updated_at)
         VALUES ('mileage_rate', ?, 'Reimbursement rate per distance unit', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(req.rate.to_string())
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;

    if let Some(ref currency) = req.currency {
        sqlx::query(
            "INSERT INTO settings (key, value, description, updated_at)
             VALUES ('mileage_currency', ?, 'Currency for mileage reimbursements', ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        )
        .bind(currency)
        .bind(&now)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;
    }

    if let Some(ref unit) = req.unit {
        sqlx::query(
            "INSERT INTO settings (key, value, description, updated_at)
             VALUES ('mileage_unit', ?, 'Distance unit: km or miles', ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        )
        .bind(unit)
        .bind(&now)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))))?;
    }

    let settings = fetch_mileage_settings(&state.db).await?;
    Ok(Json(settings))
}
