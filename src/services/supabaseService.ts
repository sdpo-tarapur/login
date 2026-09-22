import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==========================================
// 1. CREDENTIALS & CLIENT CONFIGURATION
// ==========================================

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
    cachedClient = null; 
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

// ==========================================
// 2. DIAGNOSTICS & TABLE VERIFICATION
// ==========================================

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

// ==========================================
// 3. SEED ALL DATA TO SUPABASE
// ==========================================

export async function seedAllDataToSupabase(data: {
  userAccounts?: any[];
  cases?: any[];
  ios?: any[];
  leaveLedger?: any[];
  landDisputes?: any[];
  udCases?: any[];
  dailyReports?: any[];
  messages?: any[];
}): Promise<{ success: boolean; message: string; countSummary: Record<string, number> }> {
  if (!isSupabaseConfigured() || !getSupabase()) {
    return {
      success: false,
      message: 'Supabase is not configured. Please set your Supabase URL & Anon Key first.',
      countSummary: {},
    };
  }

  const counts: Record<string, number> = {
    userAccounts: 0,
    cases: 0,
    ios: 0,
    leaveLedger: 0,
    landDisputes: 0,
    udCases: 0,
    dailyReports: 0,
    messages: 0,
  };

  try {
    for (const acc of data.userAccounts || []) {
      if (await saveUserAccountToSupabase(acc)) counts.userAccounts++;
    }
    for (const c of data.cases || []) {
      if (await saveFIRCaseToSupabase(c)) counts.cases++;
    }
    for (const io of data.ios || []) {
      if (await saveIOToSupabase(io)) counts.ios++;
    }
    for (const l of data.leaveLedger || []) {
      if (await saveLeaveLedgerEntryToSupabase(l)) counts.leaveLedger++;
    }
    for (const ld of data.landDisputes || []) {
      if (await saveLandDisputeToSupabase(ld)) counts.landDisputes++;
    }
    for (const ud of data.udCases || []) {
      if (await saveUDCaseToSupabase(ud)) counts.udCases++;
    }
    for (const rep of data.dailyReports || []) {
      if (await saveDailyReportToSupabase(rep)) counts.dailyReports++;
    }
    for (const msg of data.messages || []) {
      if (await saveUserMessageToSupabase(msg)) counts.messages++;
    }

    return {
      success: true,
      message: 'Successfully synchronized all records with Supabase Cloud Database!',
      countSummary: counts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Sync partially failed: ${err?.message || err}`,
      countSummary: counts,
    };
  }
}

// ==========================================
// 4. USER ACCOUNTS & AUTHENTICATION
// ==========================================

export async function fetchUserAccountsFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!isSupabaseConfigured() || !client) return null;
  try {
    const { data, error } = await client.from('user_accounts').select('*');
    if (error) {
      console.warn('Error fetching user accounts from Supabase:', error.message);
      return null;
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      password: row.password,
      role: row.role,
      permissionLevel: row.permission_level,
      officerName: row.officer_name,
      rank: row.rank,
      policeStation: row.police_station,
      isActive: row.is_active,
    }));
  } catch (err) {
    console.warn('Supabase exception in fetchUserAccounts:', err);
    return null;
  }
}

export async function saveUserAccountToSupabase(account: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      id: account.id,
      user_id: account.userId || account.user_id,
      password: account.password,
      role: account.role,
      permission_level: account.permissionLevel || account.permission_level,
      officer_name: account.officerName || account.officer_name,
      rank: account.rank,
      police_station: account.policeStation || account.police_station,
      is_active: account.isActive ?? account.is_active ?? true,
    };
    const { error } = await client.from('user_accounts').upsert([payload]).select();
    if (error) console.error('Save user account error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save user account exception:', err);
    return false;
  }
}

export async function deleteUserAccountFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('user_accounts').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function authenticateOfficerWithSupabase(
  userId: string,
  plainPassword: string
): Promise<{ success: boolean; account?: any; error?: string }> {
  const client = getSupabase();
  if (!isSupabaseConfigured() || !client) {
    return { success: false, error: 'Supabase not connected' };
  }

  try {
    const { data, error } = await client
      .from('user_accounts')
      .select('*')
      .eq('user_id', userId.trim())
      .eq('password', plainPassword.trim())
      .limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      const row = data[0];
      const mappedAccount = {
        id: row.id,
        userId: row.user_id,
        password: row.password,
        role: row.role,
        permissionLevel: row.permission_level,
        officerName: row.officer_name,
        rank: row.rank,
        policeStation: row.police_station,
        isActive: row.is_active,
      };
      return { success: true, account: mappedAccount };
    }

    return { success: false, error: 'Invalid credentials in Supabase database.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Authentication error' };
  }
}

// ==========================================
// 5. FIR CASES (MAPPED TO CAMELCASE)
// ==========================================

export async function fetchFIRCasesFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!isSupabaseConfigured() || !client) return null;
  try {
    const { data, error } = await client.from('fir_cases').select('*');
    if (error) {
      console.warn('Error fetching FIR cases from Supabase:', error.message);
      return null;
    }
    // Map snake_case columns from Supabase to frontend camelCase properties
    return (data || []).map((row: any) => ({
      id: row.id,
      firNumber: row.fir_number || '',
      firDate: row.fir_date || '',
      ps: row.ps,
      sections: row.sections || '',
      ioName: row.io_name || 'Unassigned',
      ioId: row.io_id || '',
      complainantName: row.complainant_name || '',
      complainantPhone: row.complainant_phone || '',
      accusedNames: row.accused_names || '',
      placeOfOccurrence: row.place_of_occurrence || '',
      designation: row.designation || 'NON_SR',
      punishmentTerm: row.punishment_term || 'less_than_7_years',
      status: row.status || 'PENDING',
      cctnsStatus: row.cctns_status || 'PENDING',
      cctnsDate: row.cctns_date || '',
      chargesheetNumber: row.chargesheet_number || '',
      chargesheetDate: row.chargesheet_date || '',
      finalFormType: row.final_form_type || '',
      supervisionNotes: row.supervision_notes || '',
    }));
  } catch (err) {
    console.warn('Supabase exception in fetchFIRCases:', err);
    return null;
  }
}

export async function saveFIRCaseToSupabase(firCase: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      id: firCase.id,
      fir_number: firCase.firNumber || firCase.fir_number,
      fir_date: firCase.firDate || firCase.fir_date,
      ps: firCase.ps,
      sections: firCase.sections,
      io_name: firCase.ioName || firCase.io_name,
      io_id: firCase.ioId || firCase.io_id,
      complainant_name: firCase.complainantName || firCase.complainant_name,
      complainant_phone: firCase.complainantPhone || firCase.complainant_phone,
      accused_names: firCase.accusedNames || firCase.accused_names,
      place_of_occurrence: firCase.placeOfOccurrence || firCase.place_of_occurrence,
      designation: firCase.designation,
      punishment_term: firCase.punishmentTerm || firCase.punishment_term,
      status: firCase.status,
      cctns_status: firCase.cctnsStatus || firCase.cctns_status,
      cctns_date: firCase.cctnsDate || firCase.cctns_date,
      chargesheet_number: firCase.chargesheetNumber || firCase.chargesheet_number,
      chargesheet_date: firCase.chargesheetDate || firCase.chargesheet_date,
      final_form_type: firCase.finalFormType || firCase.final_form_type,
      supervision_notes: firCase.supervisionNotes || firCase.supervision_notes,
    };
    const { error } = await client.from('fir_cases').upsert([payload]).select();
    if (error) console.error('Save FIR case error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save FIR case exception:', err);
    return false;
  }
}

export async function deleteFIRCaseFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('fir_cases').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 6. INVESTIGATING OFFICERS (IO)
// ==========================================

export async function fetchIOsFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('investigating_officers').select('*');
    if (error) {
      console.warn('Error fetching IOs:', error.message);
      return null;
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      rank: row.rank,
      ps: row.ps,
      phone: row.phone,
      email: row.email,
      isActive: row.is_active,
    }));
  } catch (err) {
    console.warn('Exception fetching IOs:', err);
    return null;
  }
}

export async function saveIOToSupabase(io: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      id: io.id,
      name: io.name,
      rank: io.rank,
      ps: io.ps,
      phone: io.phone,
      email: io.email,
      is_active: io.isActive ?? io.is_active ?? true,
    };
    const { error } = await client.from('investigating_officers').upsert([payload]).select();
    if (error) console.error('Save IO error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save IO exception:', err);
    return false;
  }
}

export async function deleteIOFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('investigating_officers').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 7. LEAVE LEDGER
// ==========================================

export async function fetchLeaveLedgerFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('leave_ledger').select('*');
    if (error) {
      console.warn('Error fetching leave ledger:', error.message);
      return null;
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      ps: row.ps,
      officerName: row.officer_name,
      rank: row.rank,
      departureDate: row.departure_date,
      daysOnLeave: row.days_on_leave,
      arrivalDate: row.arrival_date,
      status: row.status,
      leaveType: row.leave_type,
      remarks: row.remarks,
      recordedBy: row.recorded_by,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Exception fetching leave ledger:', err);
    return null;
  }
}

export async function saveLeaveLedgerEntryToSupabase(entry: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      id: entry.id,
      ps: entry.ps,
      officer_name: entry.officerName || entry.officer_name,
      rank: entry.rank,
      departure_date: entry.departureDate || entry.departure_date,
      days_on_leave: entry.daysOnLeave || entry.days_on_leave,
      arrival_date: entry.arrivalDate || entry.arrival_date,
      status: entry.status,
      leave_type: entry.leaveType || entry.leave_type,
      remarks: entry.remarks,
      recorded_by: entry.recordedBy || entry.recorded_by,
      created_at: entry.createdAt || entry.created_at,
    };
    const { error } = await client.from('leave_ledger').upsert([payload]).select();
    if (error) console.error('Save leave error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save leave exception:', err);
    return false;
  }
}

export async function deleteLeaveLedgerEntryFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('leave_ledger').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 8. LAND DISPUTES
// ==========================================

export async function fetchLandDisputesFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('land_disputes').select('*');
    if (error) {
      console.warn('Error fetching land disputes:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn('Exception fetching land disputes:', err);
    return null;
  }
}

export async function saveLandDisputeToSupabase(dispute: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('land_disputes').upsert([dispute]).select();
    if (error) console.error('Save land dispute error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save land dispute exception:', err);
    return false;
  }
}

export async function deleteLandDisputeFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('land_disputes').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 9. UD CASES
// ==========================================

export async function fetchUDCasesFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('ud_cases').select('*');
    if (error) {
      console.warn('Error fetching UD cases:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn('Exception fetching UD cases:', err);
    return null;
  }
}

export async function saveUDCaseToSupabase(udCase: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('ud_cases').upsert([udCase]).select();
    if (error) console.error('Save UD case error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save UD case exception:', err);
    return false;
  }
}

export async function deleteUDCaseFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('ud_cases').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 10. DAILY CRIME REPORTS
// ==========================================

export async function fetchDailyReportsFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('daily_crime_reports').select('*');
    if (error) {
      console.warn('Error fetching daily reports:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn('Exception fetching daily reports:', err);
    return null;
  }
}

export async function saveDailyReportToSupabase(report: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('daily_crime_reports').upsert([report]).select();
    if (error) console.error('Save daily report error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save daily report exception:', err);
    return false;
  }
}

export async function deleteDailyReportFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('daily_crime_reports').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 11. USER MESSAGES & DIRECTIVES
// ==========================================

export async function fetchUserMessagesFromSupabase(): Promise<any[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.from('user_messages').select('*');
    if (error) {
      console.warn('Error fetching user messages:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn('Exception fetching user messages:', err);
    return null;
  }
}

export async function saveUserMessageToSupabase(msg: any): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('user_messages').upsert([msg]).select();
    if (error) console.error('Save message error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save message exception:', err);
    return false;
  }
}

export async function deleteUserMessageFromSupabase(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('user_messages').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 12. MONTHLY ARREST OVERRIDES / ADJUSTMENTS
// ==========================================

export async function fetchMonthlyArrestOverridesFromSupabase(): Promise<Record<string, number>> {
  const client = getSupabase();
  if (!client) return {};
  try {
    const { data, error } = await client.from('monthly_arrest_adjustments').select('*');
    if (error || !data) return {};
    
    const overridesMap: Record<string, number> = {};
    data.forEach((row: any) => {
      const key = `${row.month_key}_${row.ps || 'ALL'}`;
      overridesMap[key] = row.adjusted_figure;
    });
    return overridesMap;
  } catch {
    return {};
  }
}

export async function saveMonthlyArrestOverrideToSupabase(
  monthKey: string,
  ps: string,
  figure: number,
  updatedBy: string
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const payload = {
      month_key: monthKey,
      ps: ps || 'ALL',
      adjusted_figure: figure,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from('monthly_arrest_adjustments').upsert([payload], {
      onConflict: 'month_key,ps',
    }).select();
    if (error) console.error('Save arrest override error:', error.message);
    return !error;
  } catch (err) {
    console.error('Save arrest override exception:', err);
    return false;
  }
}
