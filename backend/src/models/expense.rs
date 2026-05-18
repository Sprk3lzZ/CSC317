use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Expense {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub amount: f64,
    pub currency: String,
    pub category: String,
    pub expense_date: String,
    pub status: String,
    pub receipt_path: Option<String>,
    pub notes: Option<String>,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<String>,
    pub rejection_reason: Option<String>,
    pub departure_city: Option<String>,
    pub arrival_city: Option<String>,
    pub distance_km: Option<f64>,
    pub distance_unit: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateExpenseRequest {
    pub title: String,
    pub amount: f64,
    pub currency: Option<String>,
    pub category: String,
    pub expense_date: String,
    pub receipt_path: Option<String>,
    pub notes: Option<String>,
    pub departure_city: Option<String>,
    pub arrival_city: Option<String>,
    pub distance_km: Option<f64>,
    pub distance_unit: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateExpenseRequest {
    pub title: Option<String>,
    pub amount: Option<f64>,
    pub currency: Option<String>,
    pub category: Option<String>,
    pub expense_date: Option<String>,
    pub receipt_path: Option<String>,
    pub notes: Option<String>,
    pub departure_city: Option<String>,
    pub arrival_city: Option<String>,
    pub distance_km: Option<f64>,
    pub distance_unit: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewExpenseRequest {
    pub rejection_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ExpenseFilters {
    pub status: Option<String>,
    pub category: Option<String>,
    pub user_id: Option<String>,
    pub from_date: Option<String>,
    pub to_date: Option<String>,
}
