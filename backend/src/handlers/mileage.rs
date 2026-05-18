use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::AppState;

const NOMINATIM_URL: &str = "https://nominatim.openstreetmap.org/search";
const OSRM_URL: &str = "https://router.project-osrm.org/route/v1/driving";
const USER_AGENT: &str = "ExpenseFlow/1.0 (expense-management-api)";

#[derive(Debug, Deserialize)]
pub struct MileageCalculateRequest {
    pub from: String,
    pub to: String,
}

#[derive(Debug, Serialize)]
pub struct MileageCalculateResponse {
    pub distance: f64,
    pub unit: String,
    pub rate: f64,
    pub currency: String,
    pub amount: f64,
    pub from_resolved: String,
    pub to_resolved: String,
}

#[derive(Debug, Deserialize)]
struct NominatimResult {
    lat: String,
    lon: String,
    display_name: String,
}

#[derive(Debug, Deserialize)]
struct OsrmResponse {
    routes: Vec<OsrmRoute>,
}

#[derive(Debug, Deserialize)]
struct OsrmRoute {
    distance: f64, // metres
}

async fn geocode(client: &reqwest::Client, city: &str) -> Result<(f64, f64, String), String> {
    let results: Vec<NominatimResult> = client
        .get(NOMINATIM_URL)
        .header("User-Agent", USER_AGENT)
        .query(&[("q", city), ("format", "json"), ("limit", "1")])
        .send()
        .await
        .map_err(|e| format!("Nominatim request failed: {e}"))?
        .json()
        .await
        .map_err(|e| format!("Nominatim parse failed: {e}"))?;

    let result = results
        .into_iter()
        .next()
        .ok_or_else(|| format!("City not found: {city}"))?;

    let lat: f64 = result
        .lat
        .parse()
        .map_err(|_| format!("Invalid latitude for {city}"))?;
    let lon: f64 = result
        .lon
        .parse()
        .map_err(|_| format!("Invalid longitude for {city}"))?;

    Ok((lat, lon, result.display_name))
}

pub async fn calculate_mileage(
    State(state): State<AppState>,
    Json(req): Json<MileageCalculateRequest>,
) -> Result<Json<MileageCalculateResponse>, (StatusCode, Json<Value>)> {
    let client = reqwest::Client::new();

    let (from_lat, from_lon, from_resolved) = geocode(&client, &req.from)
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({"error": e}))))?;

    let (to_lat, to_lon, to_resolved) = geocode(&client, &req.to)
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({"error": e}))))?;

    // OSRM expects lon,lat order
    let osrm_query = format!(
        "{}/{},{};{},{}",
        OSRM_URL, from_lon, from_lat, to_lon, to_lat
    );

    let osrm_resp: OsrmResponse = client
        .get(&osrm_query)
        .header("User-Agent", USER_AGENT)
        .query(&[("overview", "false")])
        .send()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("OSRM request failed: {e}")}))))?
        .json()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("OSRM parse failed: {e}")}))))?;

    let route = osrm_resp.routes.into_iter().next().ok_or_else(|| {
        (StatusCode::BAD_REQUEST, Json(json!({"error": "No route found between the two cities"})))
    })?;

    // Fetch all three mileage settings in one query
    let rows: Vec<(String, String)> =
        sqlx::query_as("SELECT key, value FROM settings WHERE key IN ('mileage_rate', 'mileage_currency', 'mileage_unit')")
            .fetch_all(&state.db)
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

    // Convert OSRM metres to the configured unit
    let divisor = if unit == "miles" { 1609.344 } else { 1000.0 };
    let distance = (route.distance / divisor * 100.0).round() / 100.0;
    let amount = (distance * rate * 100.0).round() / 100.0;

    Ok(Json(MileageCalculateResponse {
        distance,
        unit,
        rate,
        currency,
        amount,
        from_resolved,
        to_resolved,
    }))
}
