-- PostgreSQL init script: create required extensions for smartcampus database
-- This runs once at first container start.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
