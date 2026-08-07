-- PostgreSQL initialization script
-- Run automatically when the postgres container first starts

-- Create the research_agent database (if not already created via env var)
-- CREATE DATABASE research_agent;

-- Future tables will be created here by SQLAlchemy + Alembic migrations
-- For now, just verify the connection works.

SELECT version();
