-- Add unit and currency as configurable settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES
    ('mileage_unit', 'km', 'Distance unit for mileage calculations: km or miles'),
    ('mileage_currency', 'EUR', 'Currency for mileage reimbursements');

-- Extend expenses with distance_unit for historical rendering
ALTER TABLE expenses ADD COLUMN distance_unit TEXT;
