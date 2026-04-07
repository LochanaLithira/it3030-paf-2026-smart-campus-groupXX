-- ================================================================
-- V4: Add Ticket Category Enum
-- Member 3: Maintenance & Ticketing
-- ================================================================

-- Create ticket_category enum type
CREATE TYPE ticket_category AS ENUM (
    'ELECTRICAL',
    'PLUMBING',
    'HVAC',
    'IT',
    'FURNITURE',
    'GENERAL_MAINTENANCE',
    'OTHER'
);

-- Update tickets table to use the new enum type
ALTER TABLE tickets 
    ALTER COLUMN category TYPE ticket_category USING category::ticket_category;

-- Add comment for documentation
COMMENT ON TYPE ticket_category IS 'Categories for maintenance and incident tickets';
