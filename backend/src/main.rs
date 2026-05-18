mod auth;
mod db;
mod handlers;
mod models;

use axum::{
    http::Method,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::SqlitePool;
use std::net::SocketAddr;
use axum::http::header::{AUTHORIZATION, CONTENT_TYPE};
use tower_http::cors::CorsLayer;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:./expenseflow.db".to_string());

    let pool = db::create_pool(&database_url)
        .await
        .expect("Failed to connect to database");

    db::run_migrations(&pool)
        .await
        .expect("Failed to run migrations");

    db::seed_users(&pool)
        .await
        .expect("Failed to seed users");

    let state = AppState { db: pool };

    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:3080".parse().unwrap(),
            "http://localhost:3000".parse().unwrap(),
        ])
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE])
        .allow_credentials(true);

    let app = Router::new()
        // Health
        .route("/api/health", get(health))
        // Auth
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/me", get(handlers::auth::me))
        // Expenses
        .route("/api/expenses", get(handlers::expenses::list_expenses))
        .route("/api/expenses", post(handlers::expenses::create_expense))
        .route("/api/expenses/stats", get(handlers::expenses::get_stats))
        .route("/api/expenses/:id", get(handlers::expenses::get_expense))
        .route("/api/expenses/:id", put(handlers::expenses::update_expense))
        .route("/api/expenses/:id", delete(handlers::expenses::delete_expense))
        .route("/api/expenses/:id/approve", put(handlers::expenses::approve_expense))
        .route("/api/expenses/:id/reject", put(handlers::expenses::reject_expense))
        // Mileage calculation
        .route("/api/mileage/calculate", post(handlers::mileage::calculate_mileage))
        // Settings
        .route("/api/settings/mileage", get(handlers::settings::get_mileage_settings))
        .route("/api/settings/mileage", put(handlers::settings::update_mileage_settings))
        // Users
        .route("/api/users", get(handlers::users::list_users))
        .route("/api/users/:id", get(handlers::users::get_user))
        .route("/api/users/:id/expenses", get(handlers::users::get_user_expenses))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    println!("ExpenseFlow API running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "ok",
        "service": "ExpenseFlow API"
    }))
}
