import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserAccount, FIRCase, LandDispute, UDCase, InvestigatingOfficer, DailyCrimeReport } from '../types';

/**
 * Service to sync application state with Supabase tables.
 * Safely maps snake_case database columns to camelCase React properties.
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

    return data.map((row: any) => ({
      id: String(row.id || `user-${Date.now()}`),
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
    const payload = {
      id: account.id,
      user_id: account.userId,
      password: account.password,
      role: account.role,
      permission_level: account.permissionLevel,
      officer_name: account.officerName,
      rank: account.rank,
      police_station: account.policeStation,
      contact_number: account.contactNumber,
      is_active: account.isActive,
    };
    const { error } = await supabase.from('user_accounts').upsert([payload], { onConflict: 'id' });
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
    const { data, error } = await supabase
      .from('fir_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching FIR cases from Supabase:', error);
      return null;
    }

    if (!data) return [];

    // Safely map snake_case columns from Supabase to camelCase FIRCase properties
    return data.map((row: any) => ({
      id: String(row.id),
      firNumber: String(row.fir_number || row.firNumber || ''),
      ps: String(row.ps || ''),
      firDate: String(row.fir_date || row.firDate || ''),
      sections: String(row.sections || ''),
      complainantName: String(row.complainant_name || row.complainantName || ''),
      complainantPhone: row.complainant_phone || row.complainantPhone || '',
      placeOfOccurrence: String(row.place_of_occurrence || row.placeOfOccurrence || ''),
      ioName: String(row.io_name || row.ioName || ''),
      ioId: row.io_id || row.ioId || undefined,
      designation: row.designation || 'PENDING_DESIGNATION',
      designationDate: row.designation_date || row.designationDate || undefined,
      deadlineDays: row.deadline_days ?? row.deadlineDays ?? 60,
      status: row.status || 'Under Investigation',
      chargesheetNumber: row.chargesheet_number || row.chargesheetNumber || undefined,
      chargesheetDate: row.chargesheet_date || row.chargesheetDate || undefined,
      chargesheetUploadedCCTNS: row.chargesheet_uploaded_cctns ?? row.chargesheetUploadedCCTNS ?? false,
      chargesheetCCTNSDate: row.chargesheet_cctns_date || row.chargesheetCCTNSDate || undefined,
      caseDiaryUploadedCCTNS: row.case_diary_uploaded_cctns ?? row.caseDiaryUploadedCCTNS ?? false,
      lastCaseDiaryNo: row.last_case_diary_no || row.lastCaseDiaryNo || undefined,
      lastCaseDiaryDate: row.last_case_diary_date || row.lastCaseDiaryDate || undefined,
      poVisitDate: row.po_visit_date || row.poVisitDate || undefined,
      supervisionDate: row.supervision_date || row.supervisionDate || undefined,
      prDates: row.pr_dates || row.prDates || [],
      finalPrDate: row.final_pr_date || row.finalPrDate || undefined,
      caseReviewDates: row.case_review_dates || row.caseReviewDates || [],
      sdpoSupervisionNote: row.sdpo_supervision_note || row.sdpoSupervisionNote || undefined,
      ciSupervisionNote: row.ci_supervision_note || row.ciSupervisionNote || undefined,
      psProgressRemarks: row.ps_progress_remarks || row.psProgressRemarks || undefined,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt,
    }));
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
      io_id: caseItem.ioId || null,
      designation: caseItem.designation || 'PENDING_DESIGNATION',
      designation_date: caseItem.designationDate || null,
      deadline_days: caseItem.deadlineDays ?? 60,
      status: caseItem.status || 'Under Investigation',
      chargesheet_number: caseItem.chargesheetNumber || null,
      chargesheet_date: caseItem.chargesheetDate || null,
      chargesheet_uploaded_cctns: caseItem.chargesheetUploadedCCTNS ?? false,
      chargesheet_cctns_date: caseItem.chargesheetCCTNSDate || null,
      case_diary_uploaded_cctns: caseItem.caseDiaryUploadedCCTNS ?? false,
      last_case_diary_no: caseItem.lastCaseDiaryNo || null,
      last_case_diary_date: caseItem.lastCaseDiaryDate || null,
      po_visit_date: caseItem.poVisitDate || null,
      supervision_date: caseItem.supervisionDate || null,
      pr_dates: caseItem.prDates || [],
      final_pr_date: caseItem.finalPrDate || null,
      case_review_dates: caseItem.caseReviewDates || [],
      sdpo_supervision_note: caseItem.sdpoSupervisionNote ? caseItem.sdpoSupervisionNote.trim() : null,
      ci_supervision_note: caseItem.ciSupervisionNote ? caseItem.ciSupervisionNote.trim() : null,
      ps_progress_remarks: caseItem.psProgressRemarks ? caseItem.psProgressRemarks.trim() : null,
      updated_at: new Date().toISOString(),
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
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      ps: row.ps,
      date: row.date,
      victimName: row.victim_name || row.victimName || '',
      victimAddress: row.victim_address || row.victimAddress || '',
      oppositePartyName: row.opposite_party_name || row.oppositePartyName || '',
      plotDetails: row.plot_details || row.plotDetails || '',
      disputeNature: row.dispute_nature || row.disputeNature || '',
      status: row.status || 'Pending',
      disposalDate: row.disposal_date || row.disposalDate || undefined,
      disposalRemarks: row.disposal_remarks || row.disposalRemarks || undefined,
      janataDarbarAction: row.janata_darbar_action || row.janataDarbarAction || undefined,
    }));
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveLandDisputeToSupabase(dispute: LandDispute): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const payload = {
      id: dispute.id,
      ps: dispute.ps,
      date: dispute.date,
      victim_name: dispute.victimName,
      victim_address: dispute.victimAddress,
      opposite_party_name: dispute.oppositePartyName || null,
      plot_details: dispute.plotDetails,
      dispute_nature: dispute.disputeNature,
      status: dispute.status || 'Pending',
      disposal_date: dispute.disposalDate || null,
      disposal_remarks: dispute.disposalRemarks ? dispute.disposalRemarks.trim() : null,
      janata_darbar_action: dispute.janataDarbarAction ? dispute.janataDarbarAction.trim() : null,
    };

    const { error } = await supabase.from('land_disputes').upsert([payload], { onConflict: 'id' });
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
    const { data, error } = await supabase.from('ud_cases').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching UD cases from Supabase:', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      udCaseNo: row.ud_case_no || row.udCaseNo || '',
      ps: row.ps,
      date: row.date,
      deceasedName: row.deceased_name || row.deceasedName || '',
      deceasedAgeGender: row.deceased_age_gender || row.deceasedAgeGender || '',
      placeOfOccurrence: row.place_of_occurrence || row.placeOfOccurrence || '',
      causeOfDeath: row.cause_of_death || row.causeOfDeath || '',
      postMortemReportStatus: row.post_mortem_report_status || row.postMortemReportStatus || 'Pending',
      visceralReportStatus: row.visceral_report_status || row.visceralReportStatus || 'Not Required',
      status: row.status || 'Under Investigation',
      ciSupervisionRemarks: row.ci_supervision_remarks || row.ciSupervisionRemarks || undefined,
      sdpoRemarks: row.sdpo_remarks || row.sdpoRemarks || undefined,
    }));
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveUDCaseToSupabase(udCase: UDCase): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const payload = {
      id: udCase.id,
      ud_case_no: udCase.udCaseNo,
      ps: udCase.ps,
      date: udCase.date,
      deceased_name: udCase.deceasedName,
      deceased_age_gender: udCase.deceasedAgeGender || null,
      place_of_occurrence: udCase.placeOfOccurrence,
      cause_of_death: udCase.causeOfDeath,
      post_mortem_report_status: udCase.postMortemReportStatus || 'Pending',
      visceral_report_status: udCase.visceralReportStatus || 'Not Required',
      status: udCase.status || 'Under Investigation',
      ci_supervision_remarks: udCase.ciSupervisionRemarks ? udCase.ciSupervisionRemarks.trim() : null,
      sdpo_remarks: udCase.sdpoRemarks ? udCase.sdpoRemarks.trim() : null,
    };

    const { error } = await supabase.from('ud_cases').upsert([payload], { onConflict: 'id' });
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
    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      ps: row.ps,
      date: row.date,
      firsRegisteredCount: row.firs_registered_count ?? row.firsRegisteredCount ?? 0,
      arrestsCount: row.arrests_count ?? row.arrestsCount ?? 0,
      seizuresSummary: row.seizures_summary || row.seizuresSummary || '',
      majorIncidentsNotes: row.major_incidents_notes || row.majorIncidentsNotes || '',
      submittedBy: row.submitted_by || row.submittedBy || 'Officer',
    }));
  } catch (err) {
    console.error('Supabase exception:', err);
    return null;
  }
}

export async function saveDailyReportToSupabase(report: DailyCrimeReport): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const payload = {
      id: report.id,
      ps: report.ps,
      date: report.date,
      firs_registered_count: report.firsRegisteredCount ?? 0,
      arrests_count: report.arrestsCount ?? 0,
      seizures_summary: report.seizuresSummary ? report.seizuresSummary.trim() : null,
      major_incidents_notes: report.majorIncidentsNotes ? report.majorIncidentsNotes.trim() : null,
      submitted_by: report.submittedBy,
    };

    const { error } = await supabase.from('daily_crime_reports').upsert([payload], { onConflict: 'id' });
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
