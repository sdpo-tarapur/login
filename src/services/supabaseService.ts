import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserAccount, FIRCase, LandDispute, UDCase, InvestigatingOfficer, DailyCrimeReport, UserMessage } from '../types';

/**
 * Service to sync application state with Supabase tables.
 * If Supabase is not configured yet (e.g. env vars missing),
 * methods silently return null so local state is used safely.
 */

// --- USER ACCOUNTS ---
export async function fetchUserAccountsFromSupabase(): Promise<UserAccount[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('user_accounts').select('*');
    if (error) {
      console.error('Error fetching user accounts from Supabase:', error);
      return null;
    }
    return data as UserAccount[];
  } catch (err) {
    console.error('Supabase exception:', err);
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

export async function saveFIRCaseToSupabase(firCase: FIRCase): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('fir_cases').upsert([firCase], { onConflict: 'id' });
    if (error) {
      console.error('Error saving FIR case to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
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

export async function deleteLandDisputeFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('land_disputes').delete().eq('id', id);
    if (error) {
      console.error('Error deleting land dispute from Supabase:', error);
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

export async function deleteUDCaseFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('ud_cases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting UD case from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- INVESTIGATING OFFICERS (IOs) ---
export async function fetchIOsFromSupabase(): Promise<InvestigatingOfficer[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('investigating_officers').select('*');
    if (error) {
      console.error('Error fetching IOs from Supabase:', error);
      return null;
    }
    return data as InvestigatingOfficer[];
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveIOToSupabase(io: InvestigatingOfficer): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('investigating_officers').upsert([io], { onConflict: 'id' });
    if (error) {
      console.error('Error saving IO to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
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

export async function deleteDailyReportFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('daily_crime_reports').delete().eq('id', id);
    if (error) {
      console.error('Error deleting daily report from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- USER MESSAGES & POLICE DIRECTIVES ---
export async function fetchUserMessagesFromSupabase(): Promise<UserMessage[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('user_messages').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching user messages from Supabase:', error);
      return null;
    }
    return (data || []).map((d: any) => ({
      id: d.id,
      senderUserId: d.sender_user_id || d.senderUserId,
      senderName: d.sender_name || d.senderName,
      senderRole: d.sender_role || d.senderRole,
      recipientUserId: d.recipient_user_id || d.recipientUserId,
      recipientName: d.recipient_name || d.recipientName,
      subject: d.subject,
      messageText: d.message_text || d.messageText,
      priority: d.priority || 'Routine',
      createdAt: d.created_at || d.createdAt || new Date().toISOString(),
      readBy: d.read_by || d.readBy || [],
    })) as UserMessage[];
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveUserMessageToSupabase(msg: UserMessage): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const payload = {
      id: msg.id,
      sender_user_id: msg.senderUserId,
      sender_name: msg.senderName,
      sender_role: msg.senderRole,
      recipient_user_id: msg.recipientUserId,
      recipient_name: msg.recipientName,
      subject: msg.subject,
      message_text: msg.messageText,
      priority: msg.priority,
      read_by: msg.readBy || [],
      created_at: msg.createdAt,
    };
    const { error } = await supabase.from('user_messages').upsert([payload], { onConflict: 'id' });
    if (error) {
      console.error('Error saving user message to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

export async function deleteUserMessageFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const { error } = await supabase.from('user_messages').delete().eq('id', id);
    if (error) {
      console.error('Error deleting user message from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase exception:', err);
    return false;
  }
}

// --- MONTHLY ARREST ADJUSTMENTS ---
export async function fetchMonthlyArrestOverridesFromSupabase(): Promise<Record<string, number> | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase.from('monthly_arrest_adjustments').select('*');
    if (error) {
      console.warn('Could not fetch monthly arrest adjustments from Supabase:', error.message);
      return null;
    }
    const map: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const key = `${row.month_key}_${row.ps || 'ALL'}`;
      map[key] = row.adjusted_figure;
    });
    return map;
  } catch (err) {
    console.warn('Supabase monthly arrest exception:', err);
    return null;
  }
}

export async function saveMonthlyArrestOverrideToSupabase(
  monthKey: string,
  ps: string,
  figure: number,
  updatedBy: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const payload = {
      month_key: monthKey,
      ps: ps || 'ALL',
      adjusted_figure: figure,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('monthly_arrest_adjustments').upsert([payload], { onConflict: 'month_key' });
    if (error) {
      console.warn('Could not save monthly arrest adjustment to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save monthly arrest exception:', err);
    return false;
  }
}

