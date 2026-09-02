/*
# Civic Problem Priority Engine - Core Schema

## Overview
Creates the database tables for a civic problem reporting platform where citizens
report issues (potholes, streetlights, tree planting, drainage, flood-prone areas,
road requirements, budget allocation) and an AI engine deduplicates and ranks them
by urgency.

## New Tables

### 1. civic_reports
Stores all citizen-reported civic problems.
- id (uuid, PK)
- title (text) - short problem title
- description (text) - detailed description
- category (text) - one of: pothole, streetlight, tree_planting, drainage, flood_prone, road_requirement, budget_allocation, other
- severity (int) - 1-5 scale reported by citizen (1=minor, 5=critical)
- location (text) - address/area description
- lat (numeric, nullable) - latitude
- lng (numeric, nullable) - longitude
- status (text) - one of: reported, verified, in_progress, resolved, rejected
- reporter_name (text) - name of citizen reporting
- votes (int) - upvote count from other citizens
- ai_priority_score (numeric) - computed urgency score 0-100
- ai_duplicate_group (uuid, nullable) - groups duplicate reports together
- created_at (timestamptz)
- updated_at (timestamptz)

### 2. report_votes
Tracks individual upvotes from citizens on reports.
- id (uuid, PK)
- report_id (uuid, FK to civic_reports)
- voter_name (text) - name of voter
- created_at (timestamptz)

### 3. budget_allocations
Tracks budget allocation proposals and their funding status.
- id (uuid, PK)
- title (text) - allocation name
- category (text) - matching civic_reports categories
- allocated_amount (numeric) - funds allocated
- spent_amount (numeric) - funds spent
- area (text) - geographic area
- status (text) - one of: proposed, approved, active, completed
- created_at (timestamptz)

## Security
- All tables use RLS with TO anon, authenticated (no-auth public app).
- All data is intentionally shared/public for transparency (anti-corruption goal).
*/

-- Civic Reports table
CREATE TABLE IF NOT EXISTS civic_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN ('pothole','streetlight','tree_planting','drainage','flood_prone','road_requirement','budget_allocation','other')),
  severity int NOT NULL DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
  location text NOT NULL DEFAULT '',
  lat numeric(10,6),
  lng numeric(10,6),
  status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported','verified','in_progress','resolved','rejected')),
  reporter_name text NOT NULL DEFAULT 'Anonymous',
  votes int NOT NULL DEFAULT 0,
  ai_priority_score numeric(5,2) NOT NULL DEFAULT 0,
  ai_duplicate_group uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE civic_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reports" ON civic_reports;
CREATE POLICY "anon_select_reports" ON civic_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reports" ON civic_reports;
CREATE POLICY "anon_insert_reports" ON civic_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reports" ON civic_reports;
CREATE POLICY "anon_update_reports" ON civic_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reports" ON civic_reports;
CREATE POLICY "anon_delete_reports" ON civic_reports FOR DELETE
  TO anon, authenticated USING (true);

-- Report Votes table
CREATE TABLE IF NOT EXISTS report_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES civic_reports(id) ON DELETE CASCADE,
  voter_name text NOT NULL DEFAULT 'Anonymous',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE report_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_votes" ON report_votes;
CREATE POLICY "anon_select_votes" ON report_votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_votes" ON report_votes;
CREATE POLICY "anon_insert_votes" ON report_votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_votes" ON report_votes;
CREATE POLICY "anon_delete_votes" ON report_votes FOR DELETE
  TO anon, authenticated USING (true);

-- Budget Allocations table
CREATE TABLE IF NOT EXISTS budget_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('pothole','streetlight','tree_planting','drainage','flood_prone','road_requirement','budget_allocation','other')),
  allocated_amount numeric(12,2) NOT NULL DEFAULT 0,
  spent_amount numeric(12,2) NOT NULL DEFAULT 0,
  area text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','active','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_budget" ON budget_allocations;
CREATE POLICY "anon_select_budget" ON budget_allocations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_budget" ON budget_allocations;
CREATE POLICY "anon_insert_budget" ON budget_allocations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_budget" ON budget_allocations;
CREATE POLICY "anon_update_budget" ON budget_allocations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_budget" ON budget_allocations;
CREATE POLICY "anon_delete_budget" ON budget_allocations FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_civic_reports_category ON civic_reports(category);
CREATE INDEX IF NOT EXISTS idx_civic_reports_status ON civic_reports(status);
CREATE INDEX IF NOT EXISTS idx_civic_reports_priority ON civic_reports(ai_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_civic_reports_dup_group ON civic_reports(ai_duplicate_group);
CREATE INDEX IF NOT EXISTS idx_report_votes_report_id ON report_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_category ON budget_allocations(category);
