-- Settings table for admin-configurable business rules
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default mileage rate
INSERT OR IGNORE INTO settings (key, value, description) VALUES
    ('mileage_rate', '0.35', 'Reimbursement rate per kilometer (EUR/km)');

-- Extend expenses with mileage fields
ALTER TABLE expenses ADD COLUMN departure_city TEXT;
ALTER TABLE expenses ADD COLUMN arrival_city TEXT;
ALTER TABLE expenses ADD COLUMN distance_km REAL;
