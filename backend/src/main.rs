use axum::{
    extract::State,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use axum::http::Method;

#[derive(Clone)]
struct AppState {
    message: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    message: String,
}

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: state.message.clone(),
    })
}

#[tokio::main]
async fn main() {
    let state = AppState {
        message: "Expense Management API is running!".to_string(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST]);

    let app = Router::new()
        .route("/api/health", get(health))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    println!("Backend running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
