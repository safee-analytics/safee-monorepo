-- Create PostgreSQL schemas for Safee Analytics
-- This migration creates the foundational schema structure for the modular monolith

-- Create schemas for each module
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS system;

-- Grant usage permissions on schemas to application users
GRANT USAGE ON SCHEMA identity TO PUBLIC;
GRANT USAGE ON SCHEMA finance TO PUBLIC;
GRANT USAGE ON SCHEMA hr TO PUBLIC;
GRANT USAGE ON SCHEMA sales TO PUBLIC;
GRANT USAGE ON SCHEMA system TO PUBLIC;

-- Grant create permissions for tables within each schema
GRANT CREATE ON SCHEMA identity TO PUBLIC;
GRANT CREATE ON SCHEMA finance TO PUBLIC;
GRANT CREATE ON SCHEMA hr TO PUBLIC;
GRANT CREATE ON SCHEMA sales TO PUBLIC;
GRANT CREATE ON SCHEMA system TO PUBLIC;
