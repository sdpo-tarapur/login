/**
 * SQL Schema & Migration Script for Supabase Database
 * For SDPO Tarapur Subdivision Management System
 */

export const SUPABASE_DAILY_CRIME_REPORT_SQL = `-- ==============================================================================
-- SUPABASE MIGRATION SCRIPT FOR SDPO TARAPUR CRIME & SUBDIVISION DATABASE
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Update fir_cases to support Punishment Term (7 yrs or more / less than 7 yrs)
ALTER TABLE IF EXISTS fir_cases 
ADD COLUMN IF NOT EXISTS punishment_term TEXT;

COMMENT ON COLUMN fir_cases.punishment_term IS 'Punishment term category: 7_years_or_more OR less_than_7_years';


-- 2. Enhance daily_crime_reports with multi-FIR details, OD, Gasti, Arresting, and Rank Strengths
-- If daily_crime_reports does not exist yet:
CREATE TABLE IF NOT EXISTS daily_crime_reports (
  id TEXT PRIMARY KEY,
  ps TEXT NOT NULL,
  date DATE NOT NULL,
  firs_registered_count INTEGER DEFAULT 0,
  arrests_count INTEGER DEFAULT 0,
  seizures_summary TEXT,
  major_incidents_notes TEXT,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add advanced JSONB and detail columns to daily_crime_reports
ALTER TABLE daily_crime_reports 
ADD COLUMN IF NOT EXISTS registered_firs JSONB DEFAULT '[]'::jsonb;

ALTER TABLE daily_crime_reports 
ADD COLUMN IF NOT EXISTS od_details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE daily_crime_reports 
ADD COLUMN IF NOT EXISTS gasti_details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE daily_crime_reports 
ADD COLUMN IF NOT EXISTS arrest_details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE daily_crime_reports 
ADD COLUMN IF NOT EXISTS rank_strengths JSONB DEFAULT '[]'::jsonb;

ALTER TABLE daily_crime_reports 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN daily_crime_reports.registered_firs IS 'Array of FIRs: [{firNumber, date, sections, ioName}]';
COMMENT ON COLUMN daily_crime_reports.od_details IS 'Today OD officers: {od1IoName, od2IoName, od3IoName}';
COMMENT ON COLUMN daily_crime_reports.gasti_details IS 'Today Gasti officers: {morningGastiIoName, dayGastiIoName, nightGastiIoName}';
COMMENT ON COLUMN daily_crime_reports.arrest_details IS 'Case arrests [{caseNumber, arrestCount, isLiquorRelated}], other arrests, total, liquor arrests';
COMMENT ON COLUMN daily_crime_reports.rank_strengths IS 'Rank-wise force strength: [{rank, totalStrength, present, onLeave, arrivingToday, departingToday}]';

-- Index for fast retrieval by police station and date
CREATE INDEX IF NOT EXISTS idx_daily_reports_ps_date ON daily_crime_reports (ps, date DESC);


-- 3. Create user_messages table for Inter-Station & SDPO Messaging
CREATE TABLE IF NOT EXISTS user_messages (
  id TEXT PRIMARY KEY,
  sender_user_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_text TEXT NOT NULL,
  priority TEXT DEFAULT 'Routine',
  read_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_messages_recipient ON user_messages (recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON user_messages (sender_user_id, created_at DESC);


-- 4. Create monthly_arrest_adjustments table for Super User Monthly Overrides
CREATE TABLE IF NOT EXISTS monthly_arrest_adjustments (
  month_key TEXT PRIMARY KEY, -- e.g. "2026-09"
  ps TEXT NOT NULL DEFAULT 'ALL', -- 'ALL' or specific PS
  adjusted_figure INTEGER NOT NULL,
  reason TEXT,
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if desired, or disable for simple public API keys:
ALTER TABLE daily_crime_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write access for daily_crime_reports" ON daily_crime_reports FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write access for user_messages" ON user_messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE monthly_arrest_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write access for monthly_arrest_adjustments" ON monthly_arrest_adjustments FOR ALL USING (true) WITH CHECK (true);
`;
