use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub description: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MileageSettings {
    pub rate: f64,
    pub currency: String,
    pub unit: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMileageRequest {
    pub rate: f64,
    pub currency: Option<String>,
    pub unit: Option<String>,
}
