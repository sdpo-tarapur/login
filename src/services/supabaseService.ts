import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserAccount, FIRCase, LandDispute, UDCase, InvestigatingOfficer, DailyCrimeReport } from '../types';

/**
 * Service to sync application state with Supabase tables.
 * If Supabase is not configured yet (e.g. env vars missing),
 * methods silently return null so local state is used safely.
 */

// --- USER ACCOUNTS --- 
export async function fetchUserAccountsFromSupabase(): Promise<UserAccount[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase.from('user_accounts').select('*');
    if (error) {
      console.error('Supabase fetch user_accounts error:', error);
      return null;
    }

    if (!data) return [];

    // Safely map Supabase rows to UserAccount objects
    return data.map((row: any) => ({
      id: String(row.id || `user-${Date.now()}`),
      // Handle both camelCase (userId) and snake_case (user_id) column names safely
      userId: String(row.userId || row.user_id || '').trim(),
      password: String(row.password || ''),
      role: row.role || 'SDPO',
      permissionLevel: row.permissionLevel || row.permission_level || 'EDITOR',
      officerName: String(row.officerName || row.officer_name || 'Officer'),
      rank: String(row.rank || 'Police Officer'),
      policeStation: row.policeStation || row.police_station || 'Subdivision HQ',
      contactNumber: row.contactNumber || row.contact_number || '',
      isActive: row.isActive ?? row.is_active ?? true,
    }));
  } catch (err) {
    console.error('Failed to fetch user accounts:', err);
    return null;
  }
}

export async function saveUserAccountToSupabase(account: UserAccount): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('user_accounts').upsert([account], { onConflict: 'id' });
    if (error) {
      console.error('Error saving user account to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

export async function deleteUserAccountFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('user_accounts').delete().eq('id', id);
    if (error) {
      console.error('Error deleting user account from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- FIR CASES ---
export async function fetchFIRCasesFromSupabase(): Promise<FIRCase[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('fir_cases').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching FIR cases from Supabase:', error);
      return null;
    }
    return data as FIRCase[];
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveFIRCaseToSupabase(caseItem: FIRCase): Promise<boolean> {
  if (!isSupabaseConfigured() || !caseItem) return false;

  try {
    const payload = {
      id: caseItem.id,
      fir_number: caseItem.firNumber,
      ps: caseItem.ps,
      fir_date: caseItem.firDate,
      sections: caseItem.sections,
      complainant_name: caseItem.complainantName,
      complainant_phone: caseItem.complainantPhone || null,
      place_of_occurrence: caseItem.placeOfOccurrence,
      io_name: caseItem.ioName,
      designation: caseItem.designation,
      deadline_days: caseItem.deadlineDays,
      status: caseItem.status,
      chargesheet_uploaded_cctns: caseItem.chargesheetUploadedCCTNS ?? false,
      case_diary_uploaded_cctns: caseItem.caseDiaryUploadedCCTNS ?? false,
      sdpo_supervision_note: caseItem.sdpoSupervisionNote || null,
      ci_supervision_note: caseItem.ciSupervisionNote || null,
      ps_progress_remarks: caseItem.psProgressRemarks || null,
      created_at: caseItem.createdAt,
      updated_at: caseItem.updatedAt,
    };

    const { error } = await supabase.from('fir_cases').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error saving FIR case to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving FIR case to Supabase:', err);
    return false;
  }
}

export async function deleteFIRCaseFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('fir_cases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting FIR case from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- LAND DISPUTES ---
export async function fetchLandDisputesFromSupabase(): Promise<LandDispute[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('land_disputes').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching land disputes from Supabase:', error);
      return null;
    }
    return data as LandDispute[];
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveLandDisputeToSupabase(dispute: LandDispute): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('land_disputes').upsert([dispute], { onConflict: 'id' });
    if (error) {
      console.error('Error saving land dispute to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- UD CASES ---
export async function fetchUDCasesFromSupabase(): Promise<UDCase[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('ud_cases').select('*');
    if (error) {
      console.error('Error fetching UD cases from Supabase:', error);
      return null;
    }
    return data as UDCase[];
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveUDCaseToSupabase(udCase: UDCase): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('ud_cases').upsert([udCase], { onConflict: 'id' });
    if (error) {
      console.error('Error saving UD case to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- INVESTIGATING OFFICERS (IOs) ---
// src/services/supabaseService.ts

export async function fetchIOsFromSupabase(): Promise<InvestigatingOfficer[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('investigating_officers').select('*');
    if (error) {
      console.error('Error fetching IOs from Supabase:', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      rank: row.rank,
      ps: row.ps,
      phone: row.phone || undefined,
      status: row.status || 'Active',
    }));
  } catch (err) {
    console.error('Exception fetching IOs:', err);
    return null;
  }
}

export async function saveIOToSupabase(io: InvestigatingOfficer): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !io) return false;
  try {
    const payload = {
      id: io.id,
      name: io.name,
      rank: io.rank,
      ps: io.ps,
      phone: io.phone || null,
      status: io.status || 'Active',
    };

    const { error } = await supabase.from('investigating_officers').upsert([payload], { onConflict: 'id' });
    if (error) {
      console.error('Error saving IO to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving IO:', err);
    return false;
  }
}

export async function deleteIOFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('investigating_officers').delete().eq('id', id);
    if (error) {
      console.error('Error deleting IO from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- DAILY CRIME REPORTS ---
export async function fetchDailyReportsFromSupabase(): Promise<DailyCrimeReport[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('daily_crime_reports').select('*').order('date', { ascending: false });
    if (error) {
      console.error('Error fetching daily reports from Supabase:', error);
      return null;
    }
    return data as DailyCrimeReport[];
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveDailyReportToSupabase(report: DailyCrimeReport): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('daily_crime_reports').upsert([report], { onConflict: 'id' });
    if (error) {
      console.error('Error saving daily report to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

