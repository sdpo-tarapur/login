import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- DIAGNOSTICS & TABLE VERIFICATION ---
export async function testAllSupabaseTables(): Promise<{
  connected: boolean;
  message: string;
  tables: Record<string, { status: 'ok' | 'missing' | 'error'; count?: number; error?: string }>;
}> {
  const client = getSupabase();
  if (!isSupabaseConfigured() || !client) {
    return {
      connected: false,
      message: 'Supabase is not configured. Please provide Project URL & Public Anon Key.',
      tables: {},
    };
  }

  const tableNames = [
    'user_accounts',
    'fir_cases',
    'investigating_officers',
    'leave_ledger',
    'daily_crime_reports',
    'land_disputes',
    'ud_cases',
    'user_messages',
    'monthly_arrest_adjustments',
  ];

  const results: Record<string, { status: 'ok' | 'missing' | 'error'; count?: number; error?: string }> = {};
  let anySuccess = false;

  for (const t of tableNames) {
    try {
      const { error, count } = await client.from(t).select('*', { count: 'exact', head: true });
      if (!error) {
        results[t] = { status: 'ok', count: count || 0 };
        anySuccess = true;
      } else {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          results[t] = { status: 'missing', error: 'Table does not exist. Run SQL script.' };
        } else {
          results[t] = { status: 'error', error: error.message };
        }
      }
    } catch (e: any) {
      results[t] = { status: 'error', error: e?.message || 'Network exception' };
    }
  }

  return {
    connected: anySuccess,
    message: anySuccess
      ? 'Successfully connected to Supabase database.'
      : 'Could not query Supabase tables. Ensure SQL tables are created in Supabase SQL editor.',
    tables: results,
  };
}

// Retrieve Supabase URL & Anon Key from localStorage first, then fallback to import.meta.env
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = '';
  let anonKey = '';

  try {
    const savedUrl = localStorage.getItem('sdpo_supabase_url');
    const savedKey = localStorage.getItem('sdpo_supabase_anon_key');
    if (savedUrl && savedUrl.trim()) url = savedUrl.trim();
    if (savedKey && savedKey.trim()) anonKey = savedKey.trim();
  } catch {
    // localStorage not accessible
  }

  if (!url || !anonKey) {
    const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env || {};
    if (!url) url = (metaEnv.VITE_SUPABASE_URL || '').trim();
    if (!anonKey) anonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();
  }

  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    url.startsWith('https://') &&
    url !== 'https://your-project-ref.supabase.co' &&
    anonKey !== 'your-anon-public-key' &&
    anonKey.length > 20;

  return { url, anonKey, isConfigured };
}

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseCredentials().isConfigured;
};

// Singleton Supabase Client Cache
let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) {
    cachedClient = null;
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Proxy export for backward compatibility so `supabase.from(...)` always uses the active client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      // Return a safe dummy handler if client is not configured
      if (prop === 'from') {
        return () => ({
          select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        });
      }
      return undefined;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export function saveSupabaseConfig(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl.startsWith('https://')) {
      return { success: false, error: 'Supabase URL must start with https:// (e.g. https://yourproject.supabase.co)' };
    }
    if (cleanKey.length < 20) {
      return { success: false, error: 'Invalid Anon API Key. Please provide a valid Supabase public anon key.' };
    }

    localStorage.setItem('sdpo_supabase_url', cleanUrl);
    localStorage.setItem('sdpo_supabase_anon_key', cleanKey);
    cachedClient = null; // force reload client
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save configuration' };
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem('sdpo_supabase_url');
    localStorage.removeItem('sdpo_supabase_anon_key');
    cachedClient = null;
  } catch (e) {
    console.error(e);
  }
}

// SQL Schema for the user to run in Supabase SQL Editor
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ====================================================================
-- TARAPUR POLICE SUBDIVISION PORTAL - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Execute this script in your Supabase Project -> SQL Editor
-- ====================================================================

-- 1. USER ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  permission_level TEXT DEFAULT 'EDITOR',
  officer_name TEXT NOT NULL,
  rank TEXT NOT NULL,
  police_station TEXT NOT NULL,
  contact_number TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FIR CASES TABLE
CREATE TABLE IF NOT EXISTS public.fir_cases (
  id TEXT PRIMARY KEY,
  fir_number TEXT NOT NULL,
  ps TEXT NOT NULL,
  fir_date TEXT NOT NULL,
  sections TEXT NOT NULL,
  punishment_term TEXT,
  complainant_name TEXT NOT NULL,
  complainant_phone TEXT,
  place_of_occurrence TEXT NOT NULL,
  io_name TEXT NOT NULL,
  designation TEXT DEFAULT 'PENDING_DESIGNATION',
  designation_date TEXT,
  deadline_days INTEGER DEFAULT 60,
  status TEXT DEFAULT 'Under Investigation',
  chargesheet_number TEXT,
  chargesheet_date TEXT,
  chargesheet_uploaded_cctns BOOLEAN DEFAULT false,
  chargesheet_cctns_date TEXT,
  case_diary_uploaded_cctns BOOLEAN DEFAULT false,
  last_case_diary_no TEXT,
  last_case_diary_date TEXT,
  po_visit_date TEXT,
  supervision_date TEXT,
  pr_dates JSONB DEFAULT '[]'::jsonb,
  final_pr_date TEXT,
  case_review_dates JSONB DEFAULT '[]'::jsonb,
  sdpo_supervision_note TEXT,
  ci_supervision_note TEXT,
  ps_progress_remarks TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 3. INVESTIGATING OFFICERS TABLE
CREATE TABLE IF NOT EXISTS public.investigating_officers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  ps TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  transferred_to TEXT,
  transfer_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEAVE LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.leave_ledger (
  id TEXT PRIMARY KEY,
  report_id TEXT,
  ps TEXT NOT NULL,
  officer_name TEXT NOT NULL,
  rank TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  days_on_leave INTEGER DEFAULT 1,
  arrival_date TEXT NOT NULL,
  actual_arrival_date TEXT,
  status TEXT DEFAULT 'ON_LEAVE',
  leave_type TEXT DEFAULT 'CL',
  remarks TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DAILY CRIME REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.daily_crime_reports (
  id TEXT PRIMARY KEY,
  ps TEXT NOT NULL,
  date TEXT NOT NULL,
  firs_registered_count INTEGER DEFAULT 0,
  registered_firs JSONB DEFAULT '[]'::jsonb,
  od_details JSONB DEFAULT '{}'::jsonb,
  gasti_details JSONB DEFAULT '{}'::jsonb,
  arrests_count INTEGER DEFAULT 0,
  arrest_details JSONB DEFAULT '{}'::jsonb,
  rank_strengths JSONB DEFAULT '[]'::jsonb,
  leave_ledger_entries JSONB DEFAULT '[]'::jsonb,
  seizures_summary TEXT,
  major_incidents_notes TEXT,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LAND DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.land_disputes (
  id TEXT PRIMARY KEY,
  ps TEXT NOT NULL,
  date TEXT NOT NULL,
  victim_name TEXT NOT NULL,
  victim_address TEXT NOT NULL,
  opposite_party_name TEXT,
  plot_details TEXT NOT NULL,
  dispute_nature TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  disposal_date TEXT,
  disposal_remarks TEXT,
  janata_darbar_action TEXT,
  remarks TEXT,
  created_at TEXT
);

-- 7. UNNATURAL DEATH (UD) CASES TABLE
CREATE TABLE IF NOT EXISTS public.ud_cases (
  id TEXT PRIMARY KEY,
  ud_case_no TEXT NOT NULL,
  ps TEXT NOT NULL,
  date TEXT NOT NULL,
  deceased_name TEXT NOT NULL,
  deceased_age_gender TEXT,
  place_of_occurrence TEXT NOT NULL,
  cause_of_death TEXT NOT NULL,
  post_mortem_report_status TEXT DEFAULT 'Pending',
  visceral_report_status TEXT DEFAULT 'Not Required',
  status TEXT DEFAULT 'Under Investigation',
  ci_supervision_remarks TEXT,
  sdpo_remarks TEXT
);

-- 8. USER MESSAGES & DIRECTIVES TABLE
CREATE TABLE IF NOT EXISTS public.user_messages (
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

-- 9. MONTHLY ARREST ADJUSTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.monthly_arrest_adjustments (
  month_key TEXT NOT NULL,
  ps TEXT NOT NULL DEFAULT 'ALL',
  adjusted_figure INTEGER DEFAULT 0,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (month_key, ps)
);

-- 10. IDEMPOTENT COLUMN MIGRATION CHECKS (Safe to run multiple times)
DO $$
BEGIN
  -- Daily Crime Reports missing column migrations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='arrest_details') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN arrest_details JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='od_details') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN od_details JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='gasti_details') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN gasti_details JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='registered_firs') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN registered_firs JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='rank_strengths') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN rank_strengths JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='leave_ledger_entries') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN leave_ledger_entries JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='seizures_summary') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN seizures_summary TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='daily_crime_reports' AND column_name='major_incidents_notes') THEN
    ALTER TABLE public.daily_crime_reports ADD COLUMN major_incidents_notes TEXT;
  END IF;

  -- User messages migrations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_messages' AND column_name='read_by') THEN
    ALTER TABLE public.user_messages ADD COLUMN read_by JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_messages' AND column_name='recipient_user_ids') THEN
    ALTER TABLE public.user_messages ADD COLUMN recipient_user_ids JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 11. DISABLE ROW LEVEL SECURITY (RLS) FOR DIRECT APP SYNC ACCESS
ALTER TABLE public.user_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fir_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigating_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_crime_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ud_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_arrest_adjustments DISABLE ROW LEVEL SECURITY;

-- 12. INSERT DEFAULT POLICE OFFICER ACCOUNTS IF EMPTY
INSERT INTO public.user_accounts (id, user_id, password, role, permission_level, officer_name, rank, police_station, is_active)
VALUES
  ('user-sdpo', 'sdpo.tarapur', 'sdpo@1234', 'SDPO', 'ADMIN', 'Subdivisional Police Officer', 'SDPO Tarapur', 'Subdivision HQ', true),
  ('user-ci', 'ci.tarapur', 'ci@1234', 'CI', 'EDITOR', 'Circle Inspector', 'Circle Inspector (CI)', 'Subdivision HQ', true),
  ('user-tarapur', 'sho.tarapur', 'ps@tarapur', 'PS_TARAPUR', 'EDITOR', 'SHO Tarapur', 'Station House Officer (SHO)', 'Tarapur', true),
  ('user-asarganj', 'sho.asarganj', 'ps@asarganj', 'PS_ASARGANJ', 'EDITOR', 'SHO Asarganj', 'Station House Officer (SHO)', 'Asarganj', true),
  ('user-sangrampur', 'sho.sangrampur', 'ps@sangrampur', 'PS_SANGRAMPUR', 'EDITOR', 'SHO Sangrampur', 'Station House Officer (SHO)', 'Sangrampur', true),
  ('user-harpur', 'sho.harpur', 'ps@harpur', 'PS_HARPUR', 'EDITOR', 'SHO Harpur', 'Station House Officer (SHO)', 'Harpur', true),
  ('user-op-tarapur', 'operator.tarapur', 'op@tarapur', 'PS_TARAPUR', 'OPERATOR', 'Operator Tarapur PS', 'Computer Operator / Munshi', 'Tarapur', true),
  ('user-op-asarganj', 'operator.asarganj', 'op@asarganj', 'PS_ASARGANJ', 'OPERATOR', 'Operator Asarganj PS', 'Computer Operator / Munshi', 'Asarganj', true)
ON CONFLICT (id) DO NOTHING;
`;
