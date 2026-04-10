-- V5: Add preferred contact fields to tickets table
-- These columns are required by the Ticket entity but were missing from the initial schema.

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS preferred_contact_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS preferred_contact_phone VARCHAR(20);
